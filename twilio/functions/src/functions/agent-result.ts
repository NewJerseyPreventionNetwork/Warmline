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

  const wasBridged = event.DialBridged === true || event.DialBridged === "true";

  if (wasBridged) {
    // Human accepted, was connected, and later hung up.
    response.hangup();
  } else {
    // Machine, timeout, busy, or rejected screening.
    response.redirect(`${context.STUDIO_WEBHOOK_URL}?FlowEvent=return`);
  }

  return callback(null, response);
};
