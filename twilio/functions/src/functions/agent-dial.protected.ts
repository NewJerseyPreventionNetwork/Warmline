import { twiml } from "twilio";
import type {
  Callback,
  Context,
  Event,
} from "@twilio-labs/serverless-runtime-types";

export const handler = async function (
  context: Context,
  event: Event,
  callback: Callback,
) {
  const agent = event.agent;
  const callSid = event.CallSid;

  if (!isConfiguredAgent(context.AGENT_NUMBERS, agent)) {
    return callback(new Error("Requested agent is not configured"));
  }

  if (!isValidCallSid(callSid)) {
    return callback(new Error("Invalid CallSid"));
  }

  try {
    const call = await context.getTwilioClient().calls(callSid).fetch();

    if (!["queued", "ringing", "in-progress"].includes(call.status)) {
      return callback(new Error("Call is no longer active"));
    }
  } catch (error) {
    console.error("Failed to validate CallSid", error);
    return callback(new Error("Unable to validate CallSid"));
  }

  const response = new twiml.VoiceResponse();

  const dial = response.dial({
    answerOnBridge: true,
    timeout: 25,
    action: `https://${context.DOMAIN_NAME}/agent-result`,
    method: "POST",
  });

  dial.number(
    {
      url: `https://${context.DOMAIN_NAME}/agent-screen`,
      method: "POST",
    },
    agent,
  );

  return callback(null, response);
};

function isValidCallSid(callSid: string | undefined): callSid is string {
  return Boolean(callSid && /^CA[0-9a-fA-F]{32}$/.test(callSid));
}

function isConfiguredAgent(
  configuredAgents: string | undefined,
  agent: string | undefined,
): boolean {
  if (!configuredAgents || !agent) {
    return false;
  }

  try {
    const agents: unknown = JSON.parse(configuredAgents);
    return Array.isArray(agents) && agents.includes(agent);
  } catch {
    return false;
  }
}
