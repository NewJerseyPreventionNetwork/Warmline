## Functions

The `functions` directory contains the Twilio Serverless Functions used by the current `NJPN IVR no-county` Studio Flow. Each TypeScript file is deployed as a function route based on its filename, without the `.ts` extension.

## Call routing

| Function                 | Purpose                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `agent-dial.ts`          | Dials an agent, screens the agent before bridging the caller, and sends the result to `agent-result`.  |
| `agent-screen.ts`        | Prompts the answering agent to press `1` to accept the caller. Includes a short delay before playing the prompt to allow the HubSpot browser call to connect; without this delay, the audio could begin playing before the agent's browser was ready, causing the prompt to be cut off. |
| `agent-screen-result.ts` | Accepts or rejects the agent screening response.                                                       |
| `agent-result.ts`        | Hangs up after a completed bridge or returns control to the Studio Flow when the agent is unavailable. |
| `multi-agent-dial.ts`    | Selects the next agent from the configured list and returns the remaining agents for retry logic.      |

## Opening hours

| Function                     | Purpose                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| `opening_hours.protected.ts` | Checks whether the current time is within the NJPN weekday opening hours in New Jersey time. |

## HubSpot and recordings

| Function                                 | Purpose                                                                                                                     |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `log-call-to-hubspot.protected.ts`       | Validates the Twilio call and creates the corresponding HubSpot call record.                                                |
| `recording-status-callback.protected.ts` | Updates the HubSpot call when a recording is ready and marks the call as completed.                                         |
| `recordings.ts`                          | Creates a short-lived authenticated recording URL for a valid HubSpot request.                                              |
| `download-recording.ts`                  | Authenticates a recording token, retrieves the Twilio recording, and returns the audio file, including byte-range requests. |

## Protected functions

Files ending in `.protected.ts` contain production-sensitive routing, phone-number, or integration logic. Keep their filename suffix unchanged when deploying, and use the configured environment variables for secrets and destination numbers rather than adding credentials to source code.
