# API Proposal

## Overview

This document proposes a basic REST-style API for the YouTube video annotation system.

The API is designed to support:

- YouTube video resolution and loading
- range creation, update, and deletion
- voice management
- controlled vocabulary management for `gender` and `emotion`
- voice-level statistics
- a separate admin screen for reviewing ranges and statistics by voice

This is a proposed endpoint list, not a final contract.

## General Conventions

- Transport: HTTP + JSON
- Timestamp storage: integer milliseconds
- Range validation rule: `startMs < endMs`
- Range optional fields:
  - `transcription`
  - `emotionId`
  - `note`
- Voice required fields:
  - `language`
  - `dialect`
  - `genderId`
  - `name`

## Core Endpoints

### Health and config

- `GET /health`
- `GET /config`

Suggested use:

- `GET /health` returns service status
- `GET /config` returns frontend-useful settings such as vocabulary types, default pagination, and timestamp formatting guidance

## Video Endpoints

### Resolve pasted YouTube URL

- `POST /videos/resolve`

Purpose:

- accept a pasted YouTube URL
- validate it
- normalize it
- extract the YouTube video ID

Example request:

```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=M7lc1UVf-VE"
}
```

Example response:

```json
{
  "videoId": "M7lc1UVf-VE",
  "youtubeUrl": "https://www.youtube.com/watch?v=M7lc1UVf-VE"
}
```

### Video details

- `GET /videos/:videoId`

### List ranges for one video

- `GET /videos/:videoId/ranges`

### Create range for one video

- `POST /videos/:videoId/ranges`

Example request:

```json
{
  "startMs": 72340,
  "endMs": 78925,
  "voiceId": "voice-1",
  "transcription": "optional text",
  "emotionId": "emotion-neutral",
  "note": "optional text"
}
```

## Range Endpoints

### Get one range

- `GET /ranges/:rangeId`

### Update one range

- `PATCH /ranges/:rangeId`

Supports updating:

- `startMs`
- `endMs`
- `voiceId`
- `transcription`
- `emotionId`
- `note`

### Delete one range

- `DELETE /ranges/:rangeId`

### List ranges across the system

- `GET /ranges`

Suggested filters:

- `videoId`
- `voiceId`
- `emotionId`
- `hasTranscription`
- `page`
- `pageSize`
- `sortBy`
- `sortOrder`

## Voice Endpoints

### List voices

- `GET /voices`

Optional response fields may include summary data such as total duration and range count.

### Create voice

- `POST /voices`

Example request:

```json
{
  "language": "Vietnamese",
  "dialect": "Southern",
  "genderId": "gender-female",
  "name": "Lan"
}
```

### Get one voice

- `GET /voices/:voiceId`

### Update one voice

- `PATCH /voices/:voiceId`

### Delete one voice

- `DELETE /voices/:voiceId`

## Voice Summary Endpoints

### Get total duration for one voice

- `GET /voices/:voiceId/duration`

Example response:

```json
{
  "voiceId": "voice-1",
  "totalDurationMs": 845230
}
```

### Get full statistics for one voice

- `GET /voices/:voiceId/stats`

Example response:

```json
{
  "voiceId": "voice-1",
  "rangeCount": 12,
  "totalDurationMs": 845230,
  "averageDurationMs": 70435,
  "minDurationMs": 1800,
  "maxDurationMs": 154200,
  "withTranscriptionCount": 9,
  "withoutTranscriptionCount": 3,
  "emotionCounts": {
    "emotion-neutral": 6,
    "emotion-happy": 4,
    "emotion-sad": 2
  }
}
```

### List all ranges for one voice

- `GET /voices/:voiceId/ranges`

Suggested filters:

- `hasTranscription`
- `emotionId`
- `page`
- `pageSize`
- `sortBy`
- `sortOrder`

## Controlled Vocabulary Endpoints

Recommended design: generic vocabulary endpoints by type.

Supported vocabulary types:

- `gender`
- `emotion`

### List vocabulary types

- `GET /vocabularies`

### List entries for one vocabulary

- `GET /vocabularies/:type/entries`

### Create vocabulary entry

- `POST /vocabularies/:type/entries`

Example request:

```json
{
  "value": "neutral"
}
```

### Get one vocabulary entry

- `GET /vocabularies/:type/entries/:entryId`

### Update one vocabulary entry

- `PATCH /vocabularies/:type/entries/:entryId`

### Delete one vocabulary entry

- `DELETE /vocabularies/:type/entries/:entryId`

## Admin Screen Endpoints

These endpoints support the separate admin screen described in the requirements.

### List voices for admin navigation

- `GET /admin/voices`

Suggested response fields:

- `id`
- `name`
- `language`
- `dialect`
- `totalDurationMs`
- `rangeCount`

### Get admin detail for one voice

- `GET /admin/voices/:voiceId`

### List all ranges for one voice in admin screen

- `GET /admin/voices/:voiceId/ranges`

Suggested filters:

- `hasTranscription`
- `emotionId`
- `videoId`
- `page`
- `pageSize`
- `sortBy`
- `sortOrder`

### Get admin statistics for one voice

- `GET /admin/voices/:voiceId/stats`

This endpoint may return the same shape as `GET /voices/:voiceId/stats`.

## Suggested Error Cases

### Invalid YouTube URL

- `400 Bad Request`

Example response:

```json
{
  "error": "INVALID_YOUTUBE_URL",
  "message": "The provided URL is not a supported YouTube link."
}
```

### Invalid range

- `400 Bad Request`

Example response:

```json
{
  "error": "INVALID_RANGE",
  "message": "startMs must be less than endMs."
}
```

### Invalid vocabulary value

- `400 Bad Request`

Example response:

```json
{
  "error": "INVALID_VOCABULARY_VALUE",
  "message": "The selected gender or emotion value is not valid."
}
```

### Delete blocked because value is in use

- `409 Conflict`

Example response:

```json
{
  "error": "VOCABULARY_ENTRY_IN_USE",
  "message": "This vocabulary entry cannot be deleted because it is currently in use."
}
```

## Notes

- The admin screen is separate from the main annotation screen, but this proposal does not require separate authentication or authorization roles.
- `GET /voices/:voiceId/stats` and `GET /admin/voices/:voiceId/stats` may be consolidated into one endpoint if the frontend does not need separate response shapes.
- The same applies to `GET /voices/:voiceId/ranges` and `GET /admin/voices/:voiceId/ranges`.
