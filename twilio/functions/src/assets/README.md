## Assets

The `assets` directory contains the prerecorded MP3 voice prompts used by the current `NJPN IVR no-county` Studio Flow. The files are deployed with the Twilio Functions service and played by Studio during language selection, opening-hours handling, agent routing, and voicemail fallback.

## Languages

English prompts use the plain filename. Spanish prompts include `_spanish` in the filename.

## Asset inventory

### Welcome and language selection

- `opening-message.mp3`
- `select-english.mp3`
- `select-spanish.mp3`
- `no_input_language.mp3`

### Voicemail and call handling

- `send_to_voicemail_message.mp3`
- `send_to_voicemail_spanish.mp3`
- `voicemail_message.mp3`
- `voicemail_message_spanish.mp3`
- `hold_for_agent.mp3`
- `recording_complete.mp3`
- `recording_complete_spanish.mp3`
- `disconnect1.mp3`
- `disconnect_spanish1.mp3`

### Closed hours and retry prompts

- `invalid_option_spanish.mp3`
- `invalid_options.mp3`
- `check_failed1.mp3`
- `check_failed_spanish.mp3`

## Naming conventions

- Keep filenames lowercase and preserve the existing underscores, hyphens, and numeric suffixes because Studio references the deployed asset names.
- Add a Spanish version with `_spanish` or the established `-spa` suffix when a prompt has a translated equivalent.
- Use MP3 format for new prompts and keep the spoken wording consistent with the corresponding Studio Flow path.

When replacing an audio file, keep its filename unchanged unless the Studio Flow references are updated at the same time.
