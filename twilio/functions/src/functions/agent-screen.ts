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

  const gather = response.gather({
    action: `https://${context.DOMAIN_NAME}/agent-screen-result`,
    method: "POST",
    numDigits: 1,
    timeout: 5,
  });

  gather.say(
    "Press 1 to accept this caller. If you do not press 1, the call will be declined.",
  );

  response.hangup();

  return callback(null, response);
};
