# New Jersey Prevention Network

This repository contains the files used to run the NJPN incoming phone service.

Twilio answers the phone, checks whether the service is open, contacts agents, and sends call information and recordings to HubSpot.

## Start here

The current phone flow is called `NJPN IVR no-county`. It does not ask callers for their county or route calls to county-specific numbers. The flow diagram is [docs/flow-diagrams/njpn-main-ivr.svg](docs/flow-diagrams/njpn-main-ivr.svg), and the editable Studio Flow is [twilio/studio/flows/njpn-main-ivr.json](twilio/studio/flows/njpn-main-ivr.json).

If you are setting up or deploying the service, follow these sections in order:

1. [Understand the repository](#repository-structure)
2. [Configure HubSpot and Twilio](#configure-hubspot-and-twilio)
3. [Prepare GitHub Actions](#prepare-github-actions)
4. [Deploy the Functions Service](#deploy-the-functions-service)
5. [Deploy the Studio Flow](#deploy-the-studio-flow)

## Repository structure

```text
twilio/
├── studio/       Studio Flow configuration
└── functions/    Twilio Functions and audio assets
```

More detail is available in [twilio/studio/README.md](twilio/studio/README.md) and [twilio/functions/src/functions/README.md](twilio/functions/src/functions/README.md).

## Configure HubSpot and Twilio

### HubSpot account and user access

Before publishing the Studio Flow:

- Set up the HubSpot calling channel and phone number.
- Give each agent permission to make and receive calls in HubSpot.
- Make sure agents are marked as available while working and have the calling window open to receive calls.
- A HubSpot **Super Admin is required to view and play recordings** in the current setup. Regular calling access by itself may not show recordings.

### Twilio Console setup

Before the service can create HubSpot call records or provide recordings, a Twilio administrator must add the following settings to the NJPN **Functions Service** in the Twilio Console.

Configure them separately for Development and Production. These values are not added automatically by GitHub Actions. After adding or changing them, deploy the Functions Service environment so the running Functions can use them.

| Setting                       | What it is for                                                       |
| ----------------------------- | -------------------------------------------------------------------- |
| `HUBSPOT_APP_ID`              | Identifies the NJPN connection in HubSpot.                           |
| `HUBSPOT_CLIENT_ID`           | Identifies the HubSpot app.                                          |
| `HUBSPOT_CLIENT_SECRET`       | Private key for the HubSpot app. Keep it secret.                     |
| `HUBSPOT_EXTERNAL_ACCOUNT_ID` | Identifies the connected HubSpot account.                            |
| `HUBSPOT_REFRESH_TOKEN`       | Private permission to update HubSpot. Keep it secret.                |
| `SHARED_SECRET`               | Protects temporary recording links. Keep it secret.                  |
| `ACCOUNT_SID`                 | Identifies the Twilio account that stores recordings.                |
| `AUTH_TOKEN`                  | Private Twilio password used to retrieve recordings. Keep it secret. |
| `AGENT_NUMBERS`               | JSON array of agent phone numbers used for call routing.             |
| `WEBHOOK_URL`                 | Function callback URL used to return rejected agent calls to Studio. |

Set `AGENT_NUMBERS` as one text value containing a JSON array, for example:

```json
["+18563867498", "+18566197424", "+16093224782"]
```

Do not commit any of these values to the repository.

## Prepare GitHub Actions

The project has two separate Twilio environments:

- **Development** for testing changes
- **Production** for the live phone service

The same environment must be used for the Functions Service and the Studio Flow. A GitHub administrator must add these settings to the repository:

| GitHub setting                                                  | Type                | Used by                                                 |
| --------------------------------------------------------------- | ------------------- | ------------------------------------------------------- |
| `Develop_TWILIO_ACCOUNT_SID` or `Production_TWILIO_ACCOUNT_SID` | Repository variable | Identifies the Twilio account for Functions deployment. |
| `Develop_TWILIO_API_KEY` or `Production_TWILIO_API_KEY`         | Repository variable | Allows GitHub Actions to connect to Twilio.             |
| `Develop_TWILIO_API_SECRET` or `Production_TWILIO_API_SECRET`   | Repository secret   | Private credential for the Twilio connection.           |
| `Develop_BASE_URL` or `Production_BASE_URL`                     | Repository variable | The web address of the matching Functions Service.      |

The API secret must be stored as a GitHub **secret**. Do not commit it to the repository.

## Deploy the Functions Service

Run the **Deploy Functions** GitHub Actions workflow for Development or Production. This builds and uploads the Functions code to the matching Twilio Functions Service.

After the first deployment:

1. Add the HubSpot and recording settings in the Twilio Console.
2. Deploy the Functions Service again so the settings are active.

Do not use a Development Functions Service with the Production Studio Flow, or the other way around.

## Deploy the Studio Flow

Run the **Deploy Studio Flows** GitHub Actions workflow for the same environment used for the Functions Service.

The workflow selects the matching GitHub repository variables and writes them into the Studio Flow through [twilio/studio/studio-flows.config.json](twilio/studio/studio-flows.config.json):

| Studio Flow value | Filled from                                 |
| ----------------- | ------------------------------------------- |
| `API_BASE_URL`    | `Develop_BASE_URL` or `Production_BASE_URL` |

These values are added to the Studio Flow **when the Deploy Studio Flows workflow publishes it**. They are not GitHub secrets and do not need to be typed manually into the Studio Console when using this workflow.

## How the call flow works

1. The caller hears the welcome message and selects English or Spanish.
2. The system checks whether NJPN is open.
3. During open hours, English callers are connected to an available agent. Spanish callers are sent directly to Spanish voicemail.
4. An English-speaking agent has 25 seconds to answer and then 5 seconds to press `1` to accept the caller.
5. If the agent does not answer or press `1`, the system tries the next agent.
6. If an agent accepts, the caller and agent are connected.
7. If no English-speaking agent is available, the caller is sent to English voicemail.
8. When NJPN is closed, callers hear the message for their selected language. They can press `1` to hear it again or `2` to leave a voicemail.
9. The caller records a voicemail after the tone and presses `#` when finished. The recording is added to the related HubSpot call record when it is ready.

### What agents need to do

Agents should keep the HubSpot calling window open and show themselves as available while working:

1. Answer within **25 seconds**.
2. Listen to the screening message.
3. Press **`1` within 5 seconds** to accept the caller.

A timeout, busy line, closed calling window, or any key other than `1` rejects the attempt. The agent list is configured through the `AGENT_NUMBERS` Twilio runtime variable.

## Local development and CI/CD

GitHub Actions build and deploy the Twilio Functions, assets, and Studio Flow. Changes should not normally be made directly in the Production Twilio Console because the deployed configuration can drift from this repository.

To build and deploy Functions manually from `twilio/functions`:

```bash
yarn install
yarn build:ci
yarn deploy
```

Use `yarn deploy-prod` for the Production Twilio environment after checking all environment settings.

## Technologies used

- Twilio Studio
- Twilio Functions
- Twilio Voice
- TypeScript
- HubSpot
- GitHub Actions
