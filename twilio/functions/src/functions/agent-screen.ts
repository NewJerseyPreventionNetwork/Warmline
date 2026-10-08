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
  response.pause({length:5});

  const gather = response.gather({
    action: `https://${context.DOMAIN_NAME}/agent-screen-result`,
    actionOnEmptyResult: true,
    method: "POST",
    numDigits: 1,
    timeout: 10,
  });

  gather.say(
    "Press 1 to accept this call. If you do not press 1, the call will be declined.",
  );

  return callback(null, response);
};
