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

        if (!event.jwt) {
            return callback(null, createErrorResponse(401, "Missing token"));
        }

        if (!context.SHARED_SECRET) {
            throw new Error("Missing SHARED_SECRET");
        }

        if (!context.DOMAIN_NAME) {
            throw new Error("Missing DOMAIN_NAME");
        }

        if (!context.HUBSPOT_APP_ID) {
            throw new Error("Missing HUBSPOT_APP_ID");
        }

        if (!context.HUBSPOT_EXTERNAL_ACCOUNT_ID) {
            throw new Error("Missing HUBSPOT_EXTERNAL_ACCOUNT_ID");
        }

        const payload = jwt.verify(event.jwt, context.SHARED_SECRET) as {
            externalId?: string;
            appId?: string;
            externalAccountId?: string;
        };

        if (
            payload.externalId !== externalId ||
            payload.appId !== context.HUBSPOT_APP_ID ||
            payload.externalAccountId !== context.HUBSPOT_EXTERNAL_ACCOUNT_ID
        ) {
            return callback(null, createErrorResponse(401, "Invalid token"));
        }

        await context.getTwilioClient().calls(externalId).fetch();

        const token = jwt.sign(
            {
                externalId,
                appId: context.HUBSPOT_APP_ID,
                externalAccountId: context.HUBSPOT_EXTERNAL_ACCOUNT_ID,
            },
            context.SHARED_SECRET,
            { expiresIn: "10m" }
        );

        callback(null, {
            authenticatedUrl: `https://${context.DOMAIN_NAME}/download-recording?jwt=${encodeURIComponent(token)}`,
        });
    } catch (err) {
        console.error(err);
        const response = new Twilio.Response();
        const isJwtError =
            err instanceof Error &&
            (err.name === "JsonWebTokenError" ||
                err.name === "TokenExpiredError");
        response.setStatusCode(isJwtError ? 401 : 500);
        response.appendHeader(
            "Content-Type",
            "application/json"
        );
        response.setBody({
            error: isJwtError
                ? "Invalid or expired token"
                : err instanceof Error
                    ? err.message
                    : String(err)
        });
        callback(null, response);
    }
};

function createErrorResponse(statusCode: number, message: string): Twilio.Response {
    const response = new Twilio.Response();
    response.setStatusCode(statusCode);
    response.appendHeader("Content-Type", "application/json");
    response.setBody({ error: message });
    return response;
}