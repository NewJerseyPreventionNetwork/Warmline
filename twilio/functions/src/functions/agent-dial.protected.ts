import { twiml } from "twilio";
import type {
  Callback,
  Context,
  Event,
} from "@twilio-labs/serverless-runtime-types";

export const handler = function (
  context: Context,
  event: Event,
  callback: Callback,
) {
  const agent = event.agent;

  if (!isConfiguredAgent(context.AGENT_NUMBERS, agent)) {
    const response = new twiml.VoiceResponse();
    response.say("The requested agent is not available.");
    return callback(null, response, 400);
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
