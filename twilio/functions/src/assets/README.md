## Assets

The `assets` directory contains prerecorded MP3 voice prompts used by the Twilio Studio flows. The files are deployed with the Twilio Functions service and are referenced by Studio when the caller needs an announcement, instruction, error message, or handoff prompt.

## Languages

English prompts use the plain filename. Spanish prompts include `_spanish` in the filename.

Examples:

- `select-english.mp3` and `select-spanish.mp3` ask the caller to choose a language.
- `gather_county.mp3` and `gather_county_spanish.mp3` ask for the caller's county.
- `closed_message_english.mp3` and `closed_message_spanish.mp3` are used outside opening hours.

## Asset inventory

### Welcome and language selection

- `opening-message.mp3`
- `select-english.mp3`
- `select-spanish.mp3`
- `no_input_language.mp3`

### County collection and routing

- `gather_county.mp3`
- `gather_county_spanish.mp3`
- `county_areas.mp3`
- `county_areas_spanish.mp3`
- `county_or_voicemail_select1.mp3`
- `connect_to_county_message.mp3`
- `connect_to_county_message_spanish.mp3`
- `send_to_website1.mp3`
- `send_to_website_spanish1.mp3`
- `send_to_voicemail_message.mp3`
- `send_to_voicemail_spanish.mp3`
- `voicemail_message.mp3`
- `voicemail_message_spanish.mp3`
- `voicemail_no_representative_message.mp3`

### Opening hours and call completion

- `closed_message_english.mp3`
- `closed_message_spanish.mp3`
- `hold_for_agent.mp3`
- `recording_complete.mp3`
- `recording_complete_spanish.mp3`
- `disconnect1.mp3`
- `disconnect_spanish1.mp3`

### Invalid input and retry prompts

- `invalid_option_selection.mp3`
- `invalid_option_spanish.mp3`
- `invalid_options.mp3`
- `check_failed1.mp3`
- `check_failed_spanish.mp3`
- `try-again-voice.mp3`
- `try-again-voice-spa.mp3`

## Naming conventions

- Keep filenames lowercase and preserve the existing underscores, hyphens, and numeric suffixes because Studio references the deployed asset names.
- Add a Spanish version with `_spanish` or the established `-spa` suffix when a prompt has a translated equivalent.
- Use MP3 format for new prompts and keep the spoken wording consistent with the corresponding Studio Flow path.

When replacing an audio file, keep its filename unchanged unless the Studio Flow references are updated at the same time.
