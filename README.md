# New Jersey Prevention Network

This repository contains the code and configuration used to run the NJPN incoming phone service.

There are two Twilio Studio Flows:

- `NJPN Main IVR` – used when county routing is available.
- `NJPN Fallback IVR` – used when county routing is unavailable and calls need to follow the fallback HubSpot/voicemail journey.

The exact caller journeys and behaviour of each flow are documented in [twilio/studio/README.md](twilio/studio/README.md).

Both Studio Flows use the shared Twilio Functions and audio assets under `twilio/functions`. More information about these is available in the Functions documentation.

## Start here

If you are setting up or deploying the service, follow these sections in order:

1. [Understand the repository](#repository-structure)
2. [Configure HubSpot and Twilio](#configure-hubspot-and-twilio)
3. [Prepare GitHub Actions](#prepare-github-actions)
4. [Deploy the Functions Service](#deploy-the-functions-service)
5. [Deploy the Studio Flows](#deploy-the-studio-flows)
6. [Configure the Twilio phone number](#configure-the-twilio-phone-number)
7. [Test the deployment](#test-the-deployment)

## Repository structure

```text
twilio/
├── studio/
│   ├── main-flow.json
│   ├── fallback-flow.json
│   └── README.md
└── functions/
    ├── src/
    │   ├── functions/
    │   └── assets/
    ├── dist/
    └── README.md
```

The Studio Flows share the same Functions Service.

Assets that are used by both flows can remain directly under `assets/`. Flow-specific assets can be grouped under `assets/main/` and `assets/fallback/`.

More detail is available in:

- [twilio/studio/README.md](twilio/studio/README.md)
- [twilio/functions/README.md](twilio/functions/README.md)

## Configure HubSpot and Twilio

### HubSpot account and user access

Before using the service:

- Add the phone number for each HubSpot agent under **Settings > Calling > Call Setup > Phone Numbers**.
- Give each agent permission to receive calls in HubSpot.
- Agents receiving calls should keep the HubSpot calling window open and show themselves as available.
- A HubSpot **Super Admin is required to view and play recordings** in the current setup.
- Do not configure HubSpot voicemail on the agent numbers used by this service. Unanswered calls need to return to Twilio so that the Twilio voicemail journey can run.

The HubSpot app used by this integration has already been created. Its configuration can be found in HubSpot under **Development > Projects**.

### Twilio Functions Service settings

The following environment variables must be configured on the matching Twilio Functions Service.

Development and Production have separate Functions environments. These values are not automatically created by GitHub Actions.

| Setting | What it is for | Where to get it from |
| --- | --- | --- |
| `HUBSPOT_APP_ID` | Identifies the NJPN calling integration in HubSpot. | HubSpot > Development > Projects |
| `HUBSPOT_CLIENT_ID` | Identifies the HubSpot app when authenticating with HubSpot. | HubSpot project > Auth > Client ID |
| `HUBSPOT_CLIENT_SECRET` | Private credential used to authenticate with HubSpot. | HubSpot project > Auth > Client Secret |
| `HUBSPOT_EXTERNAL_ACCOUNT_ID` | Identifies the connected NJPN HubSpot account. | HubSpot account ID |
| `HUBSPOT_REFRESH_TOKEN` | Allows the integration to obtain HubSpot access tokens. Keep it secret. | HubSpot > Development > Projects > NJPN project > Auth > copy and open the Install URL. Connect the NJPN account and copy the `code` from the redirect URL, then make a POST request to HubSpot's OAuth token endpoint using that code. Use the returned `refresh_token`. |
| `SHARED_SECRET` | Random secret used internally by the Functions Service to sign and verify temporary recording access tokens. | Generate a strong random secret for this service |
| `ACCOUNT_SID` | Identifies the Twilio account containing the call recordings. | Twilio Console |
| `AUTH_TOKEN` | Twilio credential used when retrieving recordings. Keep it secret. | Twilio Console |
| `AGENT_NUMBERS` | JSON array containing the HubSpot agent phone numbers available for routing. | HubSpot > Settings > Calling > Call Setup > Phone Numbers |
| `WEBHOOK_URL` | Studio Flow webhook URL used to return agent call results to Studio. | Twilio Studio > required Flow > Flow details |

Set `AGENT_NUMBERS` as one text value containing a JSON array, for example:

```json
["+18563867498", "+18566197424", "+16093224782"]
```

Do not commit any of these values to the repository.

After adding or changing Functions environment variables, redeploy the Functions Service so that the deployed environment uses the updated configuration.

## Prepare GitHub Actions

The project has two deployment environments:

- **Develop** – uses the Zing Twilio account for development and testing.
- **Production** – uses the NJPN Twilio account for the live phone service.

The Functions Service and Studio Flows must always be deployed using the same environment.

Repository variables and secrets are configured under:

**GitHub repository > Settings > Secrets and variables > Actions**

| GitHub setting | Type | Purpose |
| --- | --- | --- |
| `Develop_TWILIO_ACCOUNT_SID` / `Production_TWILIO_ACCOUNT_SID` | Repository variable | Twilio account to deploy to |
| `Develop_TWILIO_API_KEY` / `Production_TWILIO_API_KEY` | Repository variable | API key used by GitHub Actions |
| `Develop_TWILIO_API_SECRET` / `Production_TWILIO_API_SECRET` | Repository secret | API secret used by GitHub Actions |
| `Develop_BASE_URL` / `Production_BASE_URL` | Repository variable | URL of the matching deployed Functions Service |

Secrets must be stored as GitHub **secrets** and must not be committed to the repository.

## Deploy the Studio Flows

The Main and Fallback Studio Flow definitions are stored under `twilio/studio/flows` and are configured in `twilio/studio/studio-flows.config.json`.

The Studio workflows use this configuration to determine which flows should be synced, validated and deployed.

### Development workflow

1. Make and test the Studio changes in the Development Twilio account.
2. Run **Sync Studio Flows** for `Develop`. This syncs the configured Studio Flows from Twilio into the repository.
3. Review the PR created by the Sync workflow and merge it once the changes are correct.
4. Run **Validate Studio Flows** and select `Develop`.
5. Run **Deploy Studio Flows** and select `Develop`.
6. Test the complete call journeys in Development.

### Production workflow

Once the changes have been reviewed and tested in Development:

1. Ensure the changes being released have been merged into `main`.
2. Run **Validate Studio Flows** and select `Production`.
3. Once validation succeeds, run **Deploy Studio Flows** and select `Production`.
4. Test both Production call journeys.

A Production sync is not normally required during deployment. **Sync pulls the current Studio Flow definitions from Twilio into the repository, whereas Deploy pushes the repository Flow definitions to Twilio.**

## Deploy the Studio Flows

Studio Flow definitions are stored under `twilio/studio`.

### Development workflow

1. Make and test the Studio changes in the Development Twilio account.
2. Run **Sync Studio Flows** for `Develop`.
3. Review the PR created by the Sync workflow and merge it once the changes are correct.
4. Run **Validate Studio Flows** and select `Develop`.
5. Run **Deploy Studio Flows** and select `Develop`.
6. Test the complete call journey in Development.

### Production workflow

Once the changes have been reviewed and tested in Development:

1. Ensure the changes being released have been merged into `main`.
2. Run **Validate Studio Flows** and select `Production`.
3. Once validation succeeds, run **Deploy Studio Flows** and select `Production`.
4. Test the Production call journey.

Do not sync Production immediately before a deployment unless you specifically intend to bring changes made in the Production Twilio Console back into the repository.

The **Deploy Studio Flows** workflow selects the values for the chosen environment and applies them to the Studio Flow using [twilio/studio/studio-flows.config.json](twilio/studio/studio-flows.config.json).

| Studio Flow value | Filled from |
| --- | --- |
| `API_BASE_URL` | `Develop_BASE_URL` or `Production_BASE_URL` |

These values are applied when the Studio Flow is deployed. They should not normally need to be entered manually in the Studio Console.

## Configure the Twilio phone number

Once the Production Functions Service and Studio Flows have been deployed, configure the NJPN incoming phone number.

If a number has not already been purchased:

1. In the NJPN Twilio Console, go to **Phone Numbers → Manage → Buy a number**.
2. Search for a United States local number with **Voice** capability.
3. Select the required New Jersey number and purchase it.
4. Open the purchased number under **Phone Numbers → Manage → Active numbers**.
5. Under the incoming Voice configuration, set **A call comes in** to `Studio Flow`.
6. Select the Studio Flow that should currently handle incoming NJPN calls.
7. Save the configuration.

`NJPN Main IVR` should be selected when county routing is available. `NJPN Fallback IVR` can be selected when the county routing journey is unavailable.

The phone number determines which Studio Flow is live. Both flows can remain deployed while the incoming number points to the required flow.

## What agents need to do in HubSpot

Agents should keep the HubSpot calling window open and show themselves as available while working.

When an agent receives an NJPN call:

1. Answer the incoming call within **25 seconds**.
2. Listen to the screening message.
3. Press **`1` within 5 seconds** to accept the caller.

A timeout, busy line, unavailable agent, or any response other than `1` causes that agent attempt to be rejected. The Studio Flow then determines whether another agent should be attempted or the caller should continue to voicemail.

The available agent numbers are configured using the `AGENT_NUMBERS` Functions environment variable.

## Local development and CI/CD

GitHub Actions are the normal way to build and deploy the Twilio Functions, assets and Studio Flows.

Changes should not normally be made directly in the Production Twilio Console because this can cause the live configuration to drift from the repository.

To install dependencies and build the Functions locally:

```bash
cd twilio/functions
yarn install
yarn build:ci
```

Local builds are useful for checking that Functions and assets compile correctly before pushing changes.

Production deployments should be performed through the GitHub Actions workflows rather than manually from a developer machine.

## Technologies used

- Twilio Studio
- Twilio Functions
- Twilio Voice
- TypeScript
- HubSpot
- GitHub Actions