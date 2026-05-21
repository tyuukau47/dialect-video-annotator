# Technical Specification Proposal

## 1. Purpose

This document proposes a practical technical specification for the first version of the dialect video annotator.

It focuses on:

- recommended tech stack
- system architecture
- key backend and frontend behaviors
- pagination and filtering
- deletion rules for voices and vocabularies
- validation and data integrity

This is a proposed implementation direction, not a locked contract.

## 2. Recommended Tech Stack

### Frontend

- `Next.js` with `React` and `TypeScript`
- `Tailwind CSS` for layout and styling
- `TanStack Query` for server state and caching
- `React Hook Form` for forms
- `Zod` for client-side validation
- YouTube integration through the official `YouTube IFrame Player API`

Why:

- strong TypeScript support
- good fit for dashboard-style internal tools
- easy route separation for annotation, vocabularies, voices, and admin screens
- good ergonomics for data-heavy forms and tables

### Backend

- `FastAPI` with `Python`
- `Pydantic` for request/response schemas
- `SQLAlchemy` for ORM
- `Alembic` for migrations

Why:

- fast to build and iterate
- clear request validation
- good support for JSON APIs
- straightforward aggregate queries for admin statistics

### Database

- `PostgreSQL`

Why:

- strong relational integrity
- good indexing and aggregation support
- well suited to range, voice, vocabulary, and stats queries
- explicit schema migrations via Alembic should be part of the default operational workflow

### Deployment

- Frontend: `Vercel` or container deployment
- Backend: `Cloud Run`, `Fly.io`, or similar container platform
- Database: managed PostgreSQL such as `Supabase`, `Neon`, or `RDS`

## 3. High-Level Architecture

```text
Browser UI
  -> Next.js frontend
  -> FastAPI backend
  -> PostgreSQL
  -> YouTube IFrame Player API in browser
```

Important note:

- the app does not store video files
- the browser embeds YouTube directly
- the backend stores only annotation metadata, voice data, and admin summaries

## 4. Main Screens and Routes

Suggested frontend routes:

- `/annotation`
- `/voices`
- `/vocabularies`
- `/admin/voices`
- `/admin/voices/:voiceId`

## 5. Core Data Model

### Tables

#### `videos`

- `id`
- `youtube_video_id`
- `source_url`
- `title` nullable
- `created_at`
- `updated_at`

#### `voices`

- `id`
- `name`
- `language`
- `dialect`
- `gender_vocab_id`
- `archived_at` nullable
- `created_at`
- `updated_at`

#### `vocabulary_entries`

- `id`
- `type` with values `gender` or `emotion`
- `value`
- `is_active`
- `created_at`
- `updated_at`

#### `ranges`

- `id`
- `video_id`
- `voice_id`
- `start_ms`
- `end_ms`
- `transcription` nullable
- `emotion_vocab_id` nullable
- `note` nullable
- `created_at`
- `updated_at`
- `deleted_at` nullable only if soft delete is used

## 6. Important Validation Rules

### Range validation

- `start_ms >= 0`
- `end_ms > start_ms`
- `voice_id` is required before save
- `emotion_vocab_id` must refer to an active `emotion` vocabulary entry if present

### Voice validation

- `name` required
- `language` required
- `dialect` required
- `gender_vocab_id` required
- `gender_vocab_id` must refer to an active `gender` vocabulary entry

### Vocabulary validation

- `type` must be `gender` or `emotion`
- `value` must be unique within each vocabulary type
- empty values are not allowed

## 7. Pagination, Filtering, and Sorting

Pagination is necessary for:

- `GET /ranges`
- `GET /videos/:videoId/ranges`
- `GET /voices`
- `GET /voices/:voiceId/ranges`
- `GET /admin/voices`
- `GET /admin/voices/:voiceId/ranges`

### Recommended pagination style

Use offset pagination for v1:

- `page`
- `pageSize`

Why:

- simple to implement
- easy to integrate with admin tables
- good enough for a first version unless range counts become very large

Suggested defaults:

- `page=1`
- `pageSize=25`

Suggested maximum:

- `pageSize=100`

### Standard list response shape

```json
{
  "items": [],
  "page": 1,
  "pageSize": 25,
  "totalItems": 240,
  "totalPages": 10
}
```

### Recommended sorting support

For admin and range tables:

- `sortBy`
- `sortOrder`

Common sortable fields:

- `createdAt`
- `startMs`
- `endMs`
- `durationMs`
- `name`
- `totalDurationMs`
- `rangeCount`

### Recommended filtering support

For range lists:

- `videoId`
- `voiceId`
- `emotionId`
- `hasTranscription`

For admin voice list:

- `language`
- `dialect`
- `genderId`
- `q`

For admin voice detail:

- `videoId`
- `emotionId`
- `hasTranscription`
- `q`

## 8. Deletion Strategy

Deletion behavior needs to be explicit because voices and vocabulary entries are referenced by ranges.

### 8.1 Delete range

Recommended behavior:

- UI: instant delete with undo
- Backend: soft delete or delayed hard delete

Recommended v1 approach:

- backend uses soft delete with `deleted_at`
- deleted ranges are excluded from normal queries and statistics

Why:

- supports undo cleanly
- reduces accidental data loss
- fits frequent disposable range behavior

### 8.2 Delete voice

Recommended behavior:

- do not hard delete a voice that is referenced by any non-deleted range
- if a voice has no active ranges, allow deletion
- if a voice is in use, return `409 Conflict`

Recommended v1 rule:

- block deletion when the voice is in use
- offer archive instead

Recommended archive behavior:

- set `archived_at`
- archived voices remain visible in existing records
- archived voices are hidden from new selection by default

Why:

- preserves referential integrity
- avoids orphaned ranges
- keeps historical data stable

### 8.3 Delete vocabulary entry

Recommended behavior:

- do not hard delete a vocabulary entry that is in use by voices or ranges
- if in use, return `409 Conflict`
- allow disabling the entry for future use instead

Recommended v1 rule:

- use `is_active=false` for values that should no longer be selectable
- only allow hard delete when usage count is zero

Why:

- old records must still render correctly
- controlled vocabularies often change operationally, not historically

## 9. Statistics Strategy

### Voice total duration

The total collected duration for a voice is:

- sum of `(end_ms - start_ms)` for all non-deleted valid ranges assigned to that voice

### Required admin statistics

- range count
- total duration
- average duration
- minimum duration
- maximum duration
- with transcription count
- without transcription count
- emotion distribution

### Recommended implementation

For v1:

- compute statistics on demand with SQL aggregation

Why:

- simpler than maintaining denormalized counters
- probably fast enough for one-voice detail view

Possible later optimization:

- materialized summary table for large datasets

## 10. Necessary Frontend Features

### Annotation screen

- YouTube URL input and validation
- embedded player
- current time display
- range list with inline edit
- `Set Start` and `Set End`
- voice selector
- emotion selector
- transcription and note fields
- delete with undo

### Voice screen

- create voice
- edit voice
- archive voice
- delete only if unused
- show range count and total duration

### Vocabulary screen

- tab for `gender`
- tab for `emotion`
- create entry
- edit entry
- disable entry
- delete only if unused
- show usage count if possible

### Admin screens

- paginated voice list
- voice detail statistics
- paginated range table for one voice
- sorting and filtering

## 11. Necessary Backend Features

- YouTube URL normalization and video ID extraction
- CRUD for voices
- CRUD for vocabulary entries
- CRUD for ranges
- soft delete handling for ranges
- archive handling for voices
- active/inactive handling for vocabulary entries
- stats aggregation endpoints
- pagination and sorting
- referential integrity checks on delete

## 12. Suggested API Behavior Details

### Create range

Reject request when:

- `voiceId` is missing
- `startMs >= endMs`
- `emotionId` refers to inactive or wrong-type vocabulary

### Update range

Re-run full validation after any field change, including:

- `startMs`
- `endMs`
- `voiceId`
- `emotionId`

### Delete voice

If the voice is in use:

```json
{
  "error": "VOICE_IN_USE",
  "message": "This voice cannot be deleted because active ranges still reference it.",
  "activeRangeCount": 24
}
```

### Delete vocabulary entry

If the value is in use:

```json
{
  "error": "VOCABULARY_ENTRY_IN_USE",
  "message": "This vocabulary entry cannot be deleted because it is currently in use.",
  "usageCount": 14
}
```

## 13. Index Recommendations

Recommended indexes:

- `videos.youtube_video_id`
- `ranges.video_id`
- `ranges.voice_id`
- `ranges.emotion_vocab_id`
- `ranges.deleted_at`
- `voices.archived_at`
- `vocabulary_entries.type`
- unique index on `(vocabulary_entries.type, vocabulary_entries.value)`

These indexes support:

- video range lookups
- voice detail lookups
- admin statistics filters
- vocabulary uniqueness

## 14. Error Handling

The API should return structured error responses with:

- machine-readable `error`
- human-readable `message`
- optional context fields

Recommended common status codes:

- `400 Bad Request` for invalid input
- `404 Not Found` for missing resources
- `409 Conflict` for delete or integrity conflicts
- `422 Unprocessable Entity` for schema validation failures

## 15. Nice-to-Have Later

- cursor pagination for very large datasets
- audit trail for edits
- bulk range operations
- reassignment workflow when deleting voices or vocabulary entries
- CSV export from admin view
- keyboard shortcuts for annotators

## 16. Recommended v1 Decisions

To keep the first version simple and safe, I recommend:

- `Next.js + TypeScript` frontend
- `FastAPI + PostgreSQL` backend
- official YouTube IFrame API in browser
- offset pagination
- soft delete for ranges
- archive instead of deleting voices in use
- inactive state instead of deleting vocabulary values in use
- on-demand SQL aggregation for admin statistics
