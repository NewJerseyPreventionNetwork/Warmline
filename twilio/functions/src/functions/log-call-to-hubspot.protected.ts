declare namespace Twilio {
  class Response {
    setStatusCode(statusCode: number): void;
    appendHeader(name: string, value: string): void;
    setBody(body: unknown): void;
  }
}

type RuntimeContext = {
  HUBSPOT_APP_ID?: string;
  HUBSPOT_CLIENT_ID?: string;
  HUBSPOT_CLIENT_SECRET?: string;
  HUBSPOT_EXTERNAL_ACCOUNT_ID?: string;
  HUBSPOT_REFRESH_TOKEN?: string;
  getTwilioClient: () => {
    calls: (callSid: string) => { fetch: () => Promise<unknown> };
  };
};
type CallEvent = { CallSid?: string };
type HubSpotCallResponse = { id?: string };
type CallResponse = {
  success: true;
  callSid: string;
  hubspotCallId?: string;
};
type CallCallback = (
  error: Error | null,
  response: CallResponse | Twilio.Response,
) => void;
type AccessTokenResponse = { access_token?: string };

export const handler = async function (
  context: RuntimeContext,
  event: CallEvent,
  callback: CallCallback,
) {
  try {
    console.log("=== log-call-to-hubspot START ===");
    console.log("CallSid received:", event.CallSid);

    const callSid = event.CallSid;

    if (
      !callSid ||
      !/^CA[0-9a-fA-F]{32}$/.test(callSid) ||
      !context.HUBSPOT_APP_ID ||
      !context.HUBSPOT_EXTERNAL_ACCOUNT_ID
    ) {
      throw new Error("Missing CallSid");
    }

    console.log("Validating Twilio call:", callSid);
    await context.getTwilioClient().calls(callSid).fetch();
    console.log("Twilio call validated");

    console.log("Getting HubSpot access token");
    const accessToken = await getHubSpotAccessToken(context);
    console.log("HubSpot access token received");

    console.log("Creating HubSpot call record for:", callSid);

    const response = await fetch(
      "https://api.hubapi.com/crm/v3/objects/calls",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            hs_timestamp: new Date().toISOString(),
            hs_call_title: "NJPN Warm Line Call",
            hs_call_status: "IN_PROGRESS",

            // Required for HubSpot to later fetch the authenticated recording URL
            hs_call_source: "INTEGRATIONS_PLATFORM",
            hs_call_app_id: context.HUBSPOT_APP_ID,
            hs_call_external_id: callSid,
            hs_call_external_account_id: context.HUBSPOT_EXTERNAL_ACCOUNT_ID,
          },
        }),
      },
    );

    console.log("HubSpot create call response status:", response.status);

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const hubspotCall = (await response.json()) as HubSpotCallResponse;

    console.log("HubSpot call created:", hubspotCall.id);

    if (!hubspotCall.id) {
      throw new Error("HubSpot response did not include a call id");
    }

    console.log("=== log-call-to-hubspot SUCCESS ===");

    callback(null, {
      success: true,
      callSid,
      hubspotCallId: hubspotCall.id,
    });
  } catch (err) {
    console.error("=== log-call-to-hubspot FAILED ===");
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

async function getHubSpotAccessToken(context: RuntimeContext): Promise<string> {
  console.log("Requesting HubSpot access token");

  if (!context.HUBSPOT_CLIENT_ID) {
    throw new Error("Missing HUBSPOT_CLIENT_ID");
  }

  if (!context.HUBSPOT_CLIENT_SECRET) {
    throw new Error("Missing HUBSPOT_CLIENT_SECRET");
  }

  if (!context.HUBSPOT_REFRESH_TOKEN) {
    throw new Error("Missing HUBSPOT_REFRESH_TOKEN");
  }

  const response = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: context.HUBSPOT_CLIENT_ID,
      client_secret: context.HUBSPOT_CLIENT_SECRET,
      refresh_token: context.HUBSPOT_REFRESH_TOKEN,
    }),
  });

  console.log("HubSpot token response status:", response.status);

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${await response.text()}`);
  }

  const data = (await response.json()) as AccessTokenResponse;

  if (!data.access_token) {
    throw new Error("Token refresh response did not include an access token");
  }

  console.log("HubSpot token request successful");

  return data.access_token;
}
