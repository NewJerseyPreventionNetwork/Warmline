# Twilio Functions

The `functions` directory contains the Twilio Functions and audio assets shared by the `NJPN Main IVR` and `NJPN Fallback IVR` Studio Flows.

The Functions handle the parts of the call journey that require logic outside of Twilio Studio, including:

- Opening-hours checks
- County routing
- HubSpot agent selection and routing
- Agent screening and call bridging
- HubSpot call record creation
- Voicemail recording integration
- Providing authenticated access to Twilio recordings from HubSpot

## Structure

```text
twilio/functions/
├── src/
│   ├── functions/
│   └── assets/
├── dist/
├── package.json
└── README.md
```

### `src/functions`

Contains the TypeScript source code for the Twilio Functions.

The Functions are shared by both Studio Flows.

### `src/assets`

Contains the audio files used by the Studio Flows.

Assets used by both flows can be stored directly under `assets/`. Assets specific to one flow can be grouped under `main/` or `fallback/`.

For example:

```text
assets/
├── opening-message.mp3
├── select-english.mp3
├── main/
│   └── main-specific-message.mp3
└── fallback/
    └── fallback-specific-message.mp3
```

### `dist`

Contains the generated Functions and assets produced by the build process.

Do not make changes directly inside `dist`. Changes should be made under `src` and then rebuilt.

## County routing

## County routing

County routing is used by the `NJPN Main IVR`.

Each supported county has its phone number configured as a separate environment variable in the Twilio Functions Service. The variable name follows this format:

```text
<COUNTY_NAME>_NUMBER
```

For example:

```text
ATLANTIC_NUMBER
```

The value should be the phone number that callers for that county are transferred to. Phone numbers should be stored in E.164 format, for example:

```text
+16095551234
```

When a county phone number changes, update the corresponding environment variable in the Twilio Functions Service.

County numbers must be configured separately in the Development and Production Functions environments. Do not hard-code county phone numbers in the Studio Flow or Functions source code.

## HubSpot agent numbers

The HubSpot agent numbers available for routing are configured using the `AGENT_NUMBERS` Functions environment variable.

The value is stored as a JSON array:

```json
["+18563867498", "+18566197424", "+16093224782"]
```

Phone numbers should be stored in E.164 format.

When an agent is added, removed or has their number changed in HubSpot, update `AGENT_NUMBERS` in the corresponding Twilio Functions environment.

## Recording authentication

`SHARED_SECRET` is used internally by the Functions Service to protect recording URLs.

`/recordings` uses the secret to sign a temporary JWT.

`/download-recording` uses the same secret to verify that JWT before returning the Twilio recording.

The secret is only used internally by the Functions Service and should never be committed to the repository.

## Function environment variables

The Functions depend on environment variables configured on the Twilio Functions Service, including:

- `HUBSPOT_APP_ID`
- `HUBSPOT_CLIENT_ID`
- `HUBSPOT_CLIENT_SECRET`
- `HUBSPOT_EXTERNAL_ACCOUNT_ID`
- `HUBSPOT_REFRESH_TOKEN`
- `SHARED_SECRET`
- `ACCOUNT_SID`
- `AUTH_TOKEN`
- `AGENT_NUMBERS`
- `WEBHOOK_URL`
- County routing configuration once implemented

See the root [README](../../README.md) for setup instructions and where each value is obtained.

## Building locally

From `twilio/functions`:

```bash
yarn install
yarn build:ci
```

The project uses `@zingdev/serverless-helpers` to build the Functions and assets from `src` into `dist`.

Normal Development and Production deployments should be performed through the GitHub Actions workflows documented in the root README.