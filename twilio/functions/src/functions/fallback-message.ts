import { twiml } from "twilio";
import type {
    Context,
    EnvironmentVariables,
    ServerlessCallback,
    ServerlessEventObject,
} from "@twilio-labs/serverless-runtime-types/types";

export const handler = function (
    _context: Context<EnvironmentVariables>,
    _event: ServerlessEventObject<Record<string, any>>,
    callback: ServerlessCallback,
) {
    const response = new twiml.VoiceResponse();
    response.say(
        "We're sorry, we're unable to process your call at the moment. Please try again in some time.",
    );
    response.hangup();

    return callback(null, response);
};