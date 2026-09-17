import type {
  Callback,
  Context,
  Event,
} from "@twilio-labs/serverless-runtime-types";

export const handler = async function (
  _context: Context,
  event: Event,
  callback: Callback,
) {
  try {
    let remainingAgents: string[];

    // First attempt
    if (!event.remainingAgents) {
      remainingAgents = ["+18563867498", "+18566197424", "+16093224782"];
    } else {
      remainingAgents = JSON.parse(event.remainingAgents) as string[];
    }

    const randomIndex = Math.floor(Math.random() * remainingAgents.length);

    const nextAgent = remainingAgents.splice(randomIndex, 1)[0];

    return callback(null, {
      nextAgent,
      remainingAgents: JSON.stringify(remainingAgents),
      lastAgent: remainingAgents.length === 0 ? "true" : "false",
    });
  } catch (error) {
    console.error(error);
    return callback(error);
  }
};
