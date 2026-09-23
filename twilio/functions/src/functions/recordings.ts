const jwt = require("jsonwebtoken");

declare namespace Twilio {
  class Response {
    setStatusCode(statusCode: number): void;
    appendHeader(name: string, value: string): void;
    setBody(body: unknown): void;
  }
}

type RuntimeContext = Record<string, string | undefined>;
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
  response: RecordingResponse | Twilio.Response,
) => void;

export const handler = async function (
  context: RuntimeContext,
  event: RecordingEvent,
  callback: RecordingCallback,
) {
  try {
    const externalId = event.externalId;

    if (!externalId) {
      throw new Error(`Missing externalId: ${JSON.stringify(event)}`);
    }

    const token = jwt.sign(
      {
        externalId,
        appId: context.HUBSPOT_APP_ID,
        externalAccountId: context.HUBSPOT_EXTERNAL_ACCOUNT_ID,
      },
      context.SHARED_SECRET,
      { expiresIn: "1h" },
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
