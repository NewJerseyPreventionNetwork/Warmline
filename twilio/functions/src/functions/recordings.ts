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
  appId?: string;
  externalAccountId?: string;
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
  response: RecordingResponse | Twilio.Response,
) => void;

export const handler = async function (
  context: RuntimeContext,
  event: RecordingEvent,
  callback: RecordingCallback,
) {
  try {
    const externalId = event.externalId;

    if (!externalId || !/^CA[0-9a-fA-F]{32}$/.test(externalId)) {
      throw new Error("Invalid externalId");
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

    if (
      event.appId !== context.HUBSPOT_APP_ID ||
      event.externalAccountId !== context.HUBSPOT_EXTERNAL_ACCOUNT_ID
    ) {
      const response = new Twilio.Response();
      response.setStatusCode(401);
      response.appendHeader("Content-Type", "application/json");
      response.setBody({ error: "Unauthorized" });
      return callback(null, response);
    }

    await context.getTwilioClient().calls(externalId).fetch();

    const token = jwt.sign(
      {
        externalId,
        appId: context.HUBSPOT_APP_ID,
        externalAccountId: context.HUBSPOT_EXTERNAL_ACCOUNT_ID,
      },
      context.SHARED_SECRET,
      { expiresIn: "10m" },
    );

    callback(null, {
      authenticatedUrl: `https://${context.DOMAIN_NAME}/download-recording?jwt=${encodeURIComponent(token)}`,
    });
  } catch (err) {
    console.error(err);
    const response = new Twilio.Response();
    response.setStatusCode(500);
    response.appendHeader("Content-Type", "application/json");
    response.setBody({
      error: err instanceof Error ? err.message : String(err),
    });
    callback(null, response);
  }
};
