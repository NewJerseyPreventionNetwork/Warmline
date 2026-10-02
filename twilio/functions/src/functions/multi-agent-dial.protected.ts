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
      remainingAgents = getConfiguredAgents(context.AGENT_NUMBERS);
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

function getConfiguredAgents(value: string | undefined): string[] {
  if (!value) {
    throw new Error("Missing AGENT_NUMBERS runtime variable");
  }

  let agents: unknown;
  try {
    agents = JSON.parse(value);
  } catch {
    throw new Error("AGENT_NUMBERS must be a valid JSON array");
  }

  if (
    !Array.isArray(agents) ||
    agents.length === 0 ||
    agents.some((agent) => typeof agent !== "string" || agent.length === 0)
  ) {
    throw new Error(
      "AGENT_NUMBERS must be a non-empty JSON array of phone numbers",
    );
  }

  return agents;
}
