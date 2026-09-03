declare namespace Twilio {
    class Response {
        setStatusCode(statusCode: number): void;
        appendHeader(name: string, value: string): void;
        setBody(body: unknown): void;
    }
}

type RuntimeContext = {
    getTwilioClient: () => {
        calls: (callSid: string) => {
            recordings: (recordingSid: string) => { fetch: () => Promise<unknown> };
        };
    };
    HUBSPOT_CLIENT_ID?: string;
    HUBSPOT_CLIENT_SECRET?: string;
    HUBSPOT_REFRESH_TOKEN?: string;
};
type RecordingStatusEvent = {
    CallSid?: string;
    RecordingSid?: string;
    RecordingDuration?: string;
};
type StatusResponse = {
    success: true;
    engagementId: number;
    callSid: string;
};
type StatusCallback = (
    error: Error | null,
    response: StatusResponse | Twilio.Response
) => void;
type RetryOptions = { maxAttempts: number; baseDelayMs: number };
type HubSpotSearchResponse = { results?: Array<{ id: string }> };
type AccessTokenResponse = { access_token?: string };

export const handler = async function(
    context: RuntimeContext,
    event: RecordingStatusEvent,
    callback: StatusCallback
) {
    try {
        const callSid = event.CallSid;
        if (!callSid || !/^CA[0-9a-fA-F]{32}$/.test(callSid)) {
            throw new Error("Invalid CallSid");
        }

        const recordingSid = event.RecordingSid;

        if (!recordingSid || !/^RE[0-9a-fA-F]{32}$/.test(recordingSid)) {
            throw new Error("Invalid RecordingSid");
        }

        await context
            .getTwilioClient()
            .calls(callSid)
            .recordings(recordingSid)
            .fetch();

        const accessToken = await getHubSpotAccessToken(context);

        const engagementId = await findCallEngagementWithRetry(
            accessToken,
            callSid,
            { maxAttempts: 5, baseDelayMs: 1000 }
        );

        await updateCallCompleted(
            accessToken,
            engagementId,
            event.RecordingDuration
        );

        await markRecordingReadyWithRetry(
            accessToken,
            engagementId,
            { maxAttempts: 3, baseDelayMs: 1000 }
        );

        callback(null, { success: true, engagementId, callSid });
    } catch (err) {
        console.error(err);
        const response = new Twilio.Response();
        response.setStatusCode(500);
        response.appendHeader("Content-Type", "application/json");
        response.setBody({
            error: err instanceof Error ? err.message : String(err)
        });
        callback(null, response);
    }
};

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function findCallEngagementWithRetry(
    accessToken: string,
    callSid: string,
    { maxAttempts, baseDelayMs }: RetryOptions
): Promise<number> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        let nonRetryableError: Error | undefined;

        try {
            const searchResponse = await fetch(
                "https://api.hubapi.com/crm/objects/2026-03/calls/search",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        filterGroups: [
                            {
                                filters: [
                                    {
                                        propertyName: "hs_call_external_id",
                                        operator: "EQ",
                                        value: callSid,
                                    },
                                ],
                            },
                        ],
                    }),
                }
            );

            const searchData = await searchResponse.json() as HubSpotSearchResponse;

            if (!searchResponse.ok) {
                const searchError = new Error(
                    `HubSpot search error (${searchResponse.status}): ${JSON.stringify(searchData)}`
                );
                if (searchResponse.status < 500 && searchResponse.status !== 429) {
                    nonRetryableError = searchError;
                } else {
                    lastError = searchError;
                }
            } else if (searchData.results?.length) {
                return parseInt(searchData.results[0].id, 10);
            }

            lastError = new Error(
                `No HubSpot call found for CallSid ${callSid} (attempt ${attempt}/${maxAttempts})`
            );
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
        }

        if (nonRetryableError) {
            throw nonRetryableError;
        }

        if (attempt < maxAttempts) {
            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            await sleep(delay);
        } else {
            throw new Error(
                `Could not find HubSpot call for CallSid ${callSid} after ${maxAttempts} attempts: ${lastError?.message}`
            );
        }
    }

    throw new Error(
        `Could not find HubSpot call for CallSid ${callSid} after ${maxAttempts} attempts`
    );
}

async function markRecordingReadyWithRetry(
    accessToken: string,
    engagementId: number,
    { maxAttempts, baseDelayMs }: RetryOptions
): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        let readyResponse: Response;
        try {
            readyResponse = await fetch(
                "https://api.hubapi.com/crm/extensions/calling/2026-03/recordings/ready",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ engagementId }),
                }
            );

        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (attempt === maxAttempts) throw lastError;
            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            await sleep(delay);
            continue;
        }

        if (readyResponse.status === 204) {
            return;
        }

        const errBody = await readyResponse.text();
        lastError = new Error(`markAsReady failed (${readyResponse.status}): ${errBody}`);

        if (readyResponse.status < 500 && readyResponse.status !== 429) {
            throw lastError;
        }

        if (attempt < maxAttempts) {
            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            await sleep(delay);
        }
    }

    throw lastError || new Error("Unable to mark recording as ready");
}

async function getHubSpotAccessToken(
    context: RuntimeContext
): Promise<string> {
    if (!context.HUBSPOT_CLIENT_ID) {
        throw new Error("Missing HUBSPOT_CLIENT_ID");
    }

    if (!context.HUBSPOT_CLIENT_SECRET) {
        throw new Error("Missing HUBSPOT_CLIENT_SECRET");
    }

    if (!context.HUBSPOT_REFRESH_TOKEN) {
        throw new Error("Missing HUBSPOT_REFRESH_TOKEN");
    }

    const response = await fetch(
        "https://api.hubapi.com/oauth/v1/token",
        {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                client_id: context.HUBSPOT_CLIENT_ID,
                client_secret: context.HUBSPOT_CLIENT_SECRET,
                refresh_token: context.HUBSPOT_REFRESH_TOKEN
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Token refresh failed: ${await response.text()}`);
    }

    const data = await response.json() as AccessTokenResponse;

    if (!data.access_token) {
        throw new Error("Token refresh response did not include an access token");
    }

    return data.access_token;
}

async function updateCallCompleted(
    accessToken: string,
    engagementId: number,
    recordingDurationSeconds?: string
): Promise<void> {
    const properties: Record<string, string> = {
        hs_call_status: "COMPLETED",
    };

    if (recordingDurationSeconds !== undefined) {
        const durationSeconds = Number(recordingDurationSeconds);
        if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
            throw new Error("Invalid RecordingDuration");
        }
        properties.hs_call_duration = String(durationSeconds * 1000);
    }

    const response = await fetch(
        `https://api.hubapi.com/crm/objects/2026-03/calls/${engagementId}`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ properties }),
        }
    );

    if (!response.ok) {
        throw new Error(
            `Failed to complete HubSpot call (${response.status}): ` +
            await response.text()
        );
    }
}