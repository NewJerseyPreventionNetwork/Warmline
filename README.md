# New-Jersey-Prevention-Network

This repository contains pipelines and configuration for deploying the Twilio infrastructure required for the overall solution.

The solution uses **Twilio Studio** and **Twilio Functions** to handle incoming calls, collect county information from callers, and route calls to the appropriate destination.

## Overview

When a caller contacts the NJPN Twilio number, the Studio Flow handles the call and determines where it should be routed.

The main call flow is:

1. The caller is welcomed to NJPN.
2. The caller selects their preferred language.
3. The flow checks whether the call is within the configured opening hours.
4. The caller is asked to provide their county.
5. The county is matched against the supported county list.
6. The call is sent to the appropriate destination.
7. Where required (English language selected), the call is routed to the NJPN HubSpot number so an available agent can answer.
8. If the HubSpot call is not answered, control returns to Twilio and the Studio Flow continues with the appropriate county routing.
9. If the county cannot be identified, the caller is given additional attempts before the configured fallback route is used.

## Repository Structure

The repository contains two main areas:

```text
twilio/
├── studio/
│   └── Studio Flow configuration
│
└── functions/
    └── Twilio Serverless Functions
```

### Studio 

Studio related docs can be found here: /twilio/studio/README.md

### Functions

Functions related docs can be found here: /twilio/functions/src/functions/README.md

## HubSpot Integration

HubSpot is used as part of the inbound call handling process.

Calls can be sent from Twilio to the configured HubSpot number, where they are routed to the appropriate HubSpot agent.

The HubSpot calling configuration must be set up correctly for agents to receive incoming calls. Agents receiving calls through the HubSpot browser must have their calling window open and be available to receive calls.

The integration is designed so that unanswered calls can return to Twilio rather than remaining within HubSpot voicemail handling. The studio flow then routes that call to the correct county phone number

## Environments

The project supports separate Twilio environments:

* Development
* Production

TO-DO: Environment specific values such as phone numbers, API URLs and other configuration should be provided through the relevant environment configuration and deployment pipeline rather than being hardcoded into the Studio Flow or Functions.

## CI/CD

GitHub Actions are used to deploy the Twilio resources.

The deployment pipelines handle:

* Building the Twilio Functions
* Deploying Functions and Assets
* Deploying Studio Flows
* Applying environment specific configuration

This allows changes to the Twilio solution to be managed through source control and deployed consistently across environments.


Changes should not normally be made directly within the Prod Twilio Console Env as this can cause the deployed configuration and the repository configuration to become out of sync.

## Technologies used for this project

* Twilio Studio
* Twilio Functions
* Twilio Voice
* TypeScript
* HubSpot
* GitHub Actions
