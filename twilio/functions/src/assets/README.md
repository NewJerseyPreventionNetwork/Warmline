## Assets

The `assets` directory contains the prerecorded MP3 prompts used by the `Main IVR` and `Fallback IVR`. The files are deployed with the shared Twilio Functions Service and played by Studio.

## Languages

English prompts generally use the plain filename. Spanish prompts include `_spanish` in the filename. Flow-specific prompts remain grouped in `main/` and `fallback/`.

## Asset inventory

### Welcome and language selection

- `opening_message.mp3`
- `select_english.mp3`
- `select_spanish.mp3`

### Voicemail and call handling

- `hold_for_agent.mp3`
- `recording_complete.mp3`
- `recording_complete_spanish.mp3`
- `send_to_voicemail_message.mp3`
- `voicemail_message.mp3`
- `voicemail_message_spanish.mp3`
- `fallback/send_to_voicemail_spanish.mp3`

### Closed hours and retry prompts

- `check_failed.mp3`
- `check_failed_spanish.mp3`
- `closed_message_english.mp3`
- `closed_message_spanish.mp3`
- `invalid_selection.mp3`
- `invalid_selection_spanish.mp3`
- `repeat_hear_or_voicemail.mp3`
- `repeat_hear_or_voicemail_spanish.mp3`

### Main IVR county prompts

- `main/connect_to_county_message.mp3`
- `main/connect_to_county_message_spanish.mp3`
- `main/county_areas.mp3`
- `main/county_areas_spanish.mp3`
- `main/county_or_voicemail.mp3`
- `main/gather_county.mp3`
- `main/gather_county_spanish.mp3`
- `main/invalid_county_go_hubspot.mp3`
- `main/invalid_county_go_voicemail.mp3`
- `main/invalid_county_or_voicemail.mp3`
- `main/try_again_county.mp3`
- `main/try_again_county_spanish.mp3`

## Naming conventions

- Keep filenames lowercase and preserve underscores and directory names because Studio references the deployed asset paths.
- Keep MP3 format and align new prompts with the matching Studio Flow path.
- When replacing an audio file, keep its path unchanged unless the Studio Flow references are updated at the same time.
