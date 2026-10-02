## Studio

The `studio` directory contains the configuration for the current Twilio Studio Flow, `NJPN IVR no-county`, used by the NJPN IVR.

The flow is defined in `flows/njpn-main-ivr.json` and registered in `studio-flows.config.json`.

## Current call flow

1. The caller hears the welcome message and selects English or Spanish.
2. The system checks whether NJPN is open.
3. During open hours, English callers are connected to an available agent. Spanish callers are sent directly to Spanish voicemail.
4. An English-speaking agent has 25 seconds to answer and then 5 seconds to press `1` to accept the caller.
5. If the agent does not answer or press `1`, the system tries the next agent.
6. If an agent accepts, the caller and agent are connected.
7. If no English-speaking agent is available, the caller is sent to English voicemail.
8. When NJPN is closed, callers hear the message for their selected language. They can press `1` to hear it again or `2` to leave a voicemail.
9. The caller records a voicemail after the tone and presses `#` when finished. The recording is added to the related HubSpot call record when it is ready.

## Functions used

The flow calls these Function routes through `API_BASE_URL`:

- `/opening_hours`
- `/log-call-to-hubspot`
- `/multi-agent-dial`
- `/agent-dial`

The agent functions call `/agent-screen`, `/agent-screen-result`, and `/agent-result` as part of the screening and bridge process.

## Deployment variables

The deployment configuration replaces these flow variables during Studio deployment:

- `API_BASE_URL`: the deployed Twilio Functions service URL.

This value is supplied by the deployment pipeline for the selected environment.
