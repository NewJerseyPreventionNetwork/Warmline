import { twiml } from "twilio";

export function createTwiml(): string {
    const response = new twiml.VoiceResponse();
    response.say("We're sorry, we're unable to process your call at the moment. Please try again in some time.");
    response.hangup();
    return response.toString();
}