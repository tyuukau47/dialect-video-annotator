# Basic Requirements: YouTube Video Annotation Interface

## 1. Overview

The system should allow a user to paste a YouTube link into the application and annotate time ranges from that video.

Each annotation range represents an extract with:

- a start timestamp
- an end timestamp
- an assigned voice
- optional metadata such as transcription, emotion, and note

Timestamps must support millisecond precision.

## 2. Goal

Provide a basic annotation workflow where a user can:

1. paste a YouTube URL
2. load and display the YouTube video inside the annotation interface
3. create, edit, and remove extract ranges
4. set start/end times manually or from the current paused video position
5. assign each range to a voice
6. optionally annotate each range with transcription, emotion, and note
7. view the total collected duration for each voice
8. allow an admin to review all collected ranges for one voice
9. allow an admin to view basic statistics for one voice
10. enforce valid time ranges where `start < end`

## 3. Primary User Story

As an annotator, I want to load a YouTube video, define extract ranges precisely, and assign those ranges to voices, so that I can organize collected speech data for later use.

## 4. Functional Requirements

### 4.1 YouTube Link Input

- The interface must provide an input field for a YouTube link.
- The user must be able to paste a valid YouTube URL into the field.
- The system must support common YouTube URL formats, including:
  - `https://www.youtube.com/watch?v=...`
  - `https://youtu.be/...`
- After the user submits the link, the system must load the referenced video in the annotation interface.
- If the URL is invalid or unsupported, the system must show a clear error message and must not load a video.

### 4.2 Video Display

- The selected YouTube video must appear in the annotation interface.
- The video player must support at minimum:
  - play
  - pause
  - seek
  - reading the current playback time
- The interface must make the current playback time visible to the user.

### 4.3 Extract Range Management

- The user must be able to add a new extract range.
- The user must be able to edit an existing extract range.
- The user must be able to delete an existing extract range.
- A range must contain:
  - `start` time
  - `end` time
- The system must allow multiple ranges for the same video.
- The system does not need to prevent overlapping ranges unless that is added later.

### 4.4 Timestamp Precision and Input

- Start and end timestamps must support millisecond precision.
- The user must be able to enter timestamps manually.
- The timestamp format should be consistent throughout the UI.
- Recommended display/input format:
  - `HH:MM:SS.mmm`
- The system should normalize valid user input into the standard format.

### 4.5 Set Start / Set End from Video Position

- For each range, the interface must provide:
  - a `Set Start` button
  - a `Set End` button
- When the video is paused, clicking `Set Start` must set the range start time to the current video position.
- When the video is paused, clicking `Set End` must set the range end time to the current video position.
- The system should prevent setting start or end from the player while the video is playing, or automatically pause first before applying the value.
- The chosen behavior must be consistent across the interface.

### 4.6 Range Validation

- Every range must satisfy `start < end`.
- The system must reject ranges where:
  - `start == end`
  - `start > end`
- Validation must run when:
  - creating a range
  - editing a range
  - using `Set Start`
  - using `Set End`
- If validation fails, the system must:
  - show a clear validation message
  - prevent saving the invalid range

### 4.7 Editing Behavior

- The user must be able to update either start or end independently.
- Changes to a range should be reflected immediately in the UI.
- The system should preserve user edits until the user saves or cancels, depending on the final UI design.

### 4.8 Voice Management

- The system must allow the user to create a voice profile.
- A voice profile must contain:
  - `language`
  - `dialect`
  - `gender`
  - `name`
- The `gender` field must be selected from the system's gender vocabulary.
- The system should allow multiple voice profiles.
- The system should allow the user to edit an existing voice profile.
- The system should allow the user to delete an existing voice profile.
- The system must prevent a range from being assigned to a deleted voice without clear reassignment or validation handling.

### 4.9 Range Annotation Metadata

- Each range must be assignable to one voice profile.
- Each range must support the following fields:
  - `voice` (required)
  - `transcription` (optional)
  - `emotion` (optional)
  - `note` (optional)
- The `emotion` field, when present, must be selected from the system's emotion vocabulary.
- The user must be able to add or edit these fields when creating or editing a range.
- The system should preserve empty optional fields without validation errors.

### 4.10 Controlled Vocabularies

- The system must support controlled vocabularies for:
  - `gender`
  - `emotion`
- The system must allow the user to create vocabulary entries.
- The system must allow the user to view existing vocabulary entries.
- The system must allow the user to edit existing vocabulary entries.
- The system must allow the user to delete existing vocabulary entries.
- Voice profiles must use only values from the `gender` vocabulary.
- Range emotion values must use only values from the `emotion` vocabulary.
- The system must prevent invalid free-text values from being saved in these fields.
- If a vocabulary entry is edited, dependent records should reflect the updated label consistently.
- If a vocabulary entry is deleted, the system must prevent orphaned references through reassignment, blocking deletion, or equivalent validation handling.

### 4.11 Voice-Level Duration Summary

- The system must display the total collected duration for each voice.
- The total must be calculated from all valid ranges assigned to that voice.
- The total should update whenever:
  - a range is created
  - a range is edited
  - a range is deleted
  - a range changes voice assignment
- The total should be displayed in a human-readable duration format.
- Recommended format:
  - hours, minutes, seconds, and milliseconds as needed

### 4.12 Admin Voice Review

- The system must provide a separate admin screen for reviewing one voice profile at a time.
- In the admin view, the system must list all collected ranges assigned to the selected voice.
- The list must include at minimum:
  - range identifier or index
  - source video reference
  - start time
  - end time
  - duration
  - transcription status
  - emotion value, if present
  - note presence or note text
- The admin must be able to open or navigate to a specific range from this list.
- The admin should be able to sort or scan the list efficiently.

### 4.13 Admin Basic Statistics

- The system must display basic statistics for the selected voice in the admin view.
- The statistics must be calculated from valid ranges assigned to that voice.
- The statistics must include at minimum:
  - total number of ranges
  - total collected duration
  - average range duration
  - shortest range duration
  - longest range duration
  - number of ranges with transcription
  - number of ranges without transcription
  - count of ranges by emotion value
- The statistics should update whenever the underlying ranges for that voice change.
- The statistics should be displayed in a human-readable format.

## 5. Basic UX Requirements

- The video player and annotation controls should be visible in the same interface.
- Each range should be easy to identify in a list or table.
- Each range entry should clearly show:
  - range identifier or index
  - start time
  - end time
  - assigned voice
  - edit/delete actions
- The `Set Start` and `Set End` actions should be close to the corresponding time fields.
- Validation errors should be shown inline near the relevant range when possible.
- The interface should make it easy to select a voice when creating or editing a range.
- The interface should make it easy to select `gender` and `emotion` from controlled lists.
- The interface should show a visible summary of total collected duration per voice.
- The interface should provide a way to manage the `gender` and `emotion` vocabularies.
- The interface should provide an admin-friendly view for scanning all ranges belonging to a selected voice.
- The interface should display basic voice-level statistics in the admin view.
- The admin review and statistics experience should live on a separate screen from the main annotation interface.

## 6. Non-Functional Requirements

- The interface should respond quickly when setting timestamps from the paused player.
- Time values must remain accurate to the millisecond as stored and displayed.
- Error messages should be understandable to a non-technical user.
- Voice totals should update quickly enough to feel immediate after range changes.
- Admin range lists and statistics should load fast enough for practical review of one voice.
- The server-side system must be able to support at least 15 concurrent annotators performing normal annotation operations without unacceptable degradation in responsiveness.

## 7. Out of Scope for Basic Version

- user authentication
- role-based access control
- collaboration or multi-user annotation
- export formats beyond basic internal storage
- automatic transcript generation
- overlap detection rules between ranges
- keyboard shortcut support
- automatic voice recognition or speaker diarization
- automatic emotion detection
- free-text gender values
- free-text emotion values

## 8. Acceptance Criteria

### AC1: Load YouTube video

- Given the user pastes a valid YouTube URL
- When the user submits it
- Then the video is shown in the annotation interface and can be played/paused

### AC2: Reject invalid link

- Given the user pastes an invalid or unsupported URL
- When the user submits it
- Then the system shows an error and does not load a video

### AC3: Add range manually

- Given a video is loaded
- When the user creates a range and enters valid start and end timestamps
- Then the range is saved successfully

### AC4: Set start from paused position

- Given a video is loaded and paused at time `T`
- When the user clicks `Set Start`
- Then the range start becomes `T`

### AC5: Set end from paused position

- Given a video is loaded and paused at time `T`
- When the user clicks `Set End`
- Then the range end becomes `T`

### AC6: Enforce valid range order

- Given the user creates or edits a range
- When `start >= end`
- Then the system shows a validation error and does not allow the invalid range to be saved

### AC7: Edit existing range

- Given an existing range
- When the user changes start or end to another valid value
- Then the updated range is saved and displayed correctly

### AC8: Delete range

- Given an existing range
- When the user deletes it
- Then the range is removed from the interface

### AC9: Create voice

- Given the user wants to define a new voice
- When the user enters valid language, dialect, gender, and name values
- Then the system saves the voice profile successfully

### AC10: Annotate range with voice and optional metadata

- Given a video is loaded and at least one voice profile exists
- When the user creates or edits a range
- And assigns a voice
- And optionally enters transcription or note
- And optionally selects an emotion value from the emotion vocabulary
- Then the range is saved with the selected voice and any provided optional fields

### AC11: Create vocabulary entry

- Given the user wants to manage controlled vocabularies
- When the user creates a valid `gender` or `emotion` entry
- Then the new vocabulary entry is saved and becomes selectable in relevant forms

### AC12: Prevent invalid vocabulary value

- Given the user is creating or editing a voice or range
- When the user attempts to save a `gender` or `emotion` value outside the controlled vocabulary
- Then the system rejects the invalid value and shows a validation error

### AC13: Show total duration per voice

- Given multiple valid ranges are assigned to a voice
- When the range list changes
- Then the system recalculates and displays the total collected duration for that voice correctly

### AC14: Admin lists all ranges for one voice

- Given a voice has one or more assigned ranges
- When an admin opens the voice review view
- Then the system displays all collected ranges for that voice

### AC15: Admin sees basic statistics for one voice

- Given a voice has assigned ranges
- When an admin opens the voice review view
- Then the system displays the required basic statistics calculated from that voice's ranges

## 9. Suggested Data Model

For the basic version, each voice profile can be represented as:

```json
{
  "id": "voice-1",
  "language": "Vietnamese",
  "dialect": "Southern",
  "genderId": "gender-female",
  "name": "Lan"
}
```

Each controlled vocabulary entry can be represented as:

```json
{
  "id": "emotion-neutral",
  "type": "emotion",
  "value": "neutral"
}
```

Each extract range can be represented as:

```json
{
  "id": "range-1",
  "videoUrl": "https://www.youtube.com/watch?v=example",
  "voiceId": "voice-1",
  "start": "00:01:12.340",
  "end": "00:01:18.925",
  "transcription": "optional text",
  "emotionId": "emotion-neutral",
  "note": "optional text"
}
```

An implementation may also store timestamps internally in milliseconds for easier validation, comparison, and duration aggregation.

Derived admin statistics for one voice may be represented as:

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

## 10. Open Decisions

- Should clicking `Set Start` or `Set End` automatically pause the video if it is currently playing, or should the action be disabled until paused?
- Should ranges be saved automatically on change, or only after an explicit save action?
- Should the UI allow empty draft ranges before both timestamps are set?
- Should a range require a voice before it can be saved, or can it remain as an unassigned draft?
- Should vocabulary deletion be blocked when the value is in use, or should the UI require reassignment before deletion?
- Should the admin voice review list support filtering by transcription status, emotion, or source video in the basic version?
