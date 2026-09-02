declare namespace Twilio {
    class Response {
        setStatusCode(statusCode: number): void;
        appendHeader(name: string, value: string): void;
        setBody(body: unknown): void;
    }
}

type RuntimeContext = {
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
        if (!callSid) throw new Error("Missing CallSid");

        const recordingSid = event.RecordingSid;

        if (!recordingSid) {
            throw new Error("Missing RecordingSid");
        }

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
                throw new Error(
                    `HubSpot search error (${searchResponse.status}): ${JSON.stringify(searchData)}`
                );
            }

            if (searchData.results?.length) {
                return parseInt(searchData.results[0].id, 10);
            }

            lastError = new Error(
                `No HubSpot call found for CallSid ${callSid} (attempt ${attempt}/${maxAttempts})`
            );
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
        }

        if (attempt < maxAttempts) {
            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            await sleep(delay);
        }
    }

    throw new Error(
        `Could not find HubSpot call for CallSid ${callSid} after ${maxAttempts} attempts: ${lastError?.message}`
    );
}

async function markRecordingReadyWithRetry(
    accessToken: string,
    engagementId: number,
    { maxAttempts, baseDelayMs }: RetryOptions
): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const readyResponse = await fetch(
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

            if (readyResponse.status === 204) {
                return;
            }

            const errBody = await readyResponse.text();
            lastError = new Error(`markAsReady failed (${readyResponse.status}): ${errBody}`);

            if (readyResponse.status < 500 && readyResponse.status !== 429) {
                throw lastError;
            }
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
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
    const response = await fetch(
        "https://api.hubapi.com/oauth/v1/token",
        {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                client_id: context.HUBSPOT_CLIENT_ID || "",
                client_secret: context.HUBSPOT_CLIENT_SECRET || "",
                refresh_token: context.HUBSPOT_REFRESH_TOKEN || ""
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

    if (recordingDurationSeconds) {
        properties.hs_call_duration = String(
            Number(recordingDurationSeconds) * 1000
        );
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