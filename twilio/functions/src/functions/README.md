## Functions

This directory contains the Twilio Functions shared by the `Main IVR` and `Fallback IVR`. Function source files are deployed with the service and exposed as routes.

## Call routing

| Function                        | Purpose                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| `agent-dial.protected.ts`       | Dials a configured agent with a 25-second ring timeout and starts agent screening.    |
| `agent-screen.ts`               | Prompts the agent to press `1` to accept the call; a brief delay may be needed for HubSpot browser audio to connect, but the checked-in function does not currently add one. |
| `agent-screen-result.ts`        | Accepts or rejects the agent's screening response.                                    |
| `agent-result.ts`               | Ends a completed bridge or returns the agent attempt result to Studio.                |
| `multi-agent-dial.protected.ts` | Selects the next agent from `AGENT_NUMBERS` and returns the remaining list.           |
| `fallback-message.ts`           | Plays an error message and hangs up.                                                  |

## County routing

| Function                               | Purpose                                                                           |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| `county_mapping.protected.ts`          | Maps English keypad county codes; `0` maps to the representative choice.          |
| `county_mapping_spanish.protected.ts`  | Maps Spanish keypad county codes to county names.                                 |
| `validate_county.protected.ts`         | Validates and normalizes spoken English county names and representative requests. |
| `validate_county_spanish.protected.ts` | Validates and normalizes spoken Spanish county names, including “Cabo May.”       |
| `county_number.protected.ts`           | Resolves county names to their configured county destination numbers.             |

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
