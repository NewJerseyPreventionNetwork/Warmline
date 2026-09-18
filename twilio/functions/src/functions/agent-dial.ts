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
  const response = new twiml.VoiceResponse();
  const agent = event.agent;

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
