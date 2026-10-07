import { twiml } from "twilio";
import type {
    Callback,
    Context,
    Event,
} from "@twilio-labs/serverless-runtime-types";

export const handler = function (
    _context: Context,
    _event: Event,
    callback: Callback,
) {
    const response = new twiml.VoiceResponse();
    response.say(
        "We're sorry, we're unable to process your call at the moment. Please try again in some time.",
    );
    response.hangup();

    return callback(null, response);
};