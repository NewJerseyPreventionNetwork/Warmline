const jwt = require("jsonwebtoken");

declare namespace Twilio {
    class Response {
        setStatusCode(statusCode: number): void;
        appendHeader(name: string, value: string): void;
        setBody(body: unknown): void;
    }
}

type RuntimeContext = Record<string, string | undefined> & {
    getTwilioClient: () => {
        calls: (callSid: string) => { fetch: () => Promise<unknown> };
    };
};
type RecordingEvent = {
    externalId?: string;
    jwt?: string;
    request?: {
        headers?: {
            range?: string;
            Range?: string;
        };
    };
};
type RecordingResponse = { authenticatedUrl: string };
type RecordingCallback = (
    error: Error | null,
    response: RecordingResponse | Twilio.Response
) => void;

export const handler = async function(
    context: RuntimeContext,
    event: RecordingEvent,
    callback: RecordingCallback
) {
    try {
        const externalId = event.externalId;

        if (!externalId || !/^CA[0-9a-fA-F]{32}$/.test(externalId)) {
            throw new Error("Invalid externalId");
        }

        if (
            !context.SHARED_SECRET ||
            !context.DOMAIN_NAME ||
            !context.HUBSPOT_APP_ID ||
            !context.HUBSPOT_EXTERNAL_ACCOUNT_ID
        ) {
            throw new Error("Missing required HubSpot/Twilio configuration");
        }

        await context.getTwilioClient().calls(externalId).fetch();

        const token = jwt.sign(
            {
                externalId,
                appId: context.HUBSPOT_APP_ID,
                externalAccountId: context.HUBSPOT_EXTERNAL_ACCOUNT_ID,
            },
            context.SHARED_SECRET,
            { expiresIn: "1h" }
        );

        callback(null, {
            authenticatedUrl: `https://${context.DOMAIN_NAME}/download-recording?jwt=${encodeURIComponent(token)}`,
        });
    } catch (err) {
        console.error(err);
        const response = new Twilio.Response();
        response.setStatusCode(500);
        response.appendHeader(
            "Content-Type",
            "application/json"
        );
        response.setBody({
            error: err instanceof Error ? err.message : String(err)
        });
        callback(null, response);
    }
};