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

  if (event.Digits === "1") {
    response.say("Connecting you now.");
    // No Hangup: Twilio proceeds with the bridge.
  } else {
    response.hangup();
  }

  return callback(null, response);
};
