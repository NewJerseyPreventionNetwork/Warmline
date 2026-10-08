# Studio

The `studio` directory contains the Twilio Studio Flow definitions used by the NJPN incoming phone service.

There are two Studio Flows:

- `Main IVR` – the primary flow, used when county routing is available.
- `Fallback IVR` – the fallback flow, used when county routing is unavailable.

Both flows are registered in `studio-flows.config.json`.

## Main IVR

The Main IVR allows callers to be routed based on their selected language and, during opening hours, their county or preferred representative.

### English

During opening hours:

1. The caller selects English.
2. The caller can say their county or request a representative.
3. If a county is provided, the caller is connected to the relevant county number.
4. If a representative is requested, the caller is routed to an available HubSpot agent.
5. If the HubSpot agent journey cannot connect the caller, the caller is sent to voicemail.

Outside opening hours, the caller is sent through the out-of-hours journey and can leave a voicemail.

### Spanish

During opening hours:

1. The caller selects Spanish.
2. The caller can say their county or request to leave a voicemail.
3. If a county is provided, the caller is connected to its configured county number.
4. If voicemail is requested, the caller is sent to the Spanish voicemail journey.

Outside opening hours, the caller is sent through the Spanish out-of-hours journey and can leave a voicemail.

## Fallback IVR

The Fallback IVR is used when county routing is unavailable. It removes the county routing journey while keeping the service available through HubSpot and voicemail.

### English

During opening hours:

1. The caller selects English.
2. The caller is routed directly to an available HubSpot agent.
3. If an agent does not accept the call, the system attempts the next available agent.
4. If no agent accepts the call, the caller is sent to English voicemail.

Outside opening hours, the caller is sent through the English out-of-hours journey and can leave a voicemail.

### Spanish

Spanish callers are sent to the Spanish voicemail journey rather than HubSpot agent routing.

The appropriate in-hours or out-of-hours message is played before the caller is given the option to leave a voicemail.

## HubSpot agent routing

Where a flow routes an English caller to HubSpot agents:

1. An agent has 25 seconds to answer the incoming call.
2. The agent hears a screening message asking them to press `1` to accept the call.
3. The agent has 10 seconds to respond.
4. If accepted, the caller and agent are connected.
5. If the attempt is not accepted, the flow can try the next available agent.
6. If no agent accepts the call, the caller is sent to voicemail.

The Functions used to manage agent selection, screening and call bridging are documented in the Functions README.

## Voicemail

Both flows use Twilio voicemail for journeys where the caller cannot or does not need to be connected directly.

The caller records their message after the tone and presses `#` when finished.

Once the recording is ready, the integration makes it available from the associated HubSpot call record.

## Studio configuration

The Studio Flow definitions are stored under:

```text
twilio/studio/
├── flows/
│   ├── njpn-main-ivr.json
│   └── njpn-fallback-ivr.json
├── studio-flows.config.json
└── README.md
```

Both flows are registered in `studio-flows.config.json`. This configuration is used by the Studio Sync, Validate and Deploy workflows.

The configuration also replaces `API_BASE_URL` during deployment with the Functions Service URL for the selected environment.
