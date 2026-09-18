## Studio

The `studio` directory contains the configuration for the current Twilio Studio Flow, `NJPN IVR no-county`, used by the NJPN IVR.

The flow is defined in `flows/njpn-main-ivr.json` and registered in `studio-flows.config.json`.

## Current call flow

The flow controls this call journey:

1. Plays the welcome message and asks the caller to select English or Spanish.
2. Checks whether the service is open during the configured weekday hours.
3. If open, logs the call to HubSpot and attempts to connect the caller to an available agent.
4. The agent is screened and must press `1` to accept the call.
5. If an agent answers, the caller is connected and the call ends when the bridge completes.
6. If no agent answers, the flow tries the next available agent.
7. If no agent is available, the caller can leave a voicemail.
8. If the service is closed, the caller hears the relevant English or Spanish closed-hours message and can replay it or leave a voicemail.
9. Completed voicemail recordings are sent through the recording status callback and the caller hears a completion message.

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
- `HUBSPOT_NUMBER`: the HubSpot destination number.

These values are supplied by the deployment pipeline for the selected environment. The flow also passes the remaining agent list between `multi-agent-dial` attempts.

TO-DO: Add the mermaid-js diagram
