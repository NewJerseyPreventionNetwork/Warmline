import type {
  Callback,
  Context,
  Event,
} from "@twilio-labs/serverless-runtime-types";

export const handler = async function (
  context: Context,
  event: Event,
  callback: Callback,
) {
  try {
    let remainingAgents: string[];

    // First attempt
    if (!event.remainingAgents) {
      if (!context.AGENT_NUMBERS) {
        throw new Error("Missing AGENT_NUMBERS");
      }

      const configuredAgents = JSON.parse(context.AGENT_NUMBERS);
      remainingAgents = configuredAgents;
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
