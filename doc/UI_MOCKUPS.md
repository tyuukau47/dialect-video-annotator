# Tentative UI Mockups

## Overview

This document proposes tentative UI mockups for all screens required by the current product requirements.

The mockups are intentionally low-fidelity. They define:

- screen structure
- major components
- primary user actions
- rough layout direction

These mockups are based on the current visual direction shown in the reference screenshot:

- two-column desktop layout
- utility-first data tool styling
- strong focus on the embedded YouTube player
- forms and lists visible in the same workspace

## Screen List

The current product needs these screens:

1. Annotation workspace
2. Voice management screen
3. Vocabulary management screen
4. Admin voice list screen
5. Admin voice detail screen

## Shared Layout Direction

### Visual style

- light background
- teal primary actions
- bordered white cards
- simple form controls
- dense but readable information layout

### Global top bar

Suggested global header:

```text
+----------------------------------------------------------------------------------+
| DIALECT VIDEO ANNOTATOR                                    [Annotation] [Admin] |
+----------------------------------------------------------------------------------+
```

Suggested nav items:

- `Annotation`
- `Voices`
- `Vocabularies`
- `Admin`

The first version can also collapse `Voices` and `Vocabularies` into utilities linked from the annotation screen if preferred.

## 1. Annotation Workspace

### Purpose

Main working screen for:

- pasting a YouTube link
- loading the video
- creating/editing/deleting ranges
- assigning a voice
- entering optional transcription, emotion, and note
- seeing per-voice duration totals

### Layout

```text
+--------------------------------------------------------------------------------------------------+
| DIALECT VIDEO ANNOTATOR                                                       [Admin] [JSON]     |
+--------------------------------------------------------------------------------------------------+
| Left sidebar                              | Main workspace                                        |
|-------------------------------------------+-------------------------------------------------------|
| Voices                                    | YouTube URL                                           |
| [Search voice.................]           | [https://youtube.com/watch?v=.................] [Load]|
|                                           |                                                       |
| [ + New Voice ] [ Manage Vocab ]          | +---------------------------------------------------+ |
|                                           | |                                                   | |
| Voice cards / list                        | |                 YouTube Player                     | |
| ----------------------------------------  | |                                                   | |
| > Hue female 01                           | +---------------------------------------------------+ |
|   Vietnamese / Hue / Female               | Current time: 00:12:43.284   [Play] [Pause] [Open]  |
|   01:43:22 total / 24 ranges              |                                                       |
|                                           | [ + Add Range ]                                       |
| > Quynh Anh                               |                                                       |
|   Vietnamese / Hue / Female               | Range editor / range list                             |
|   00:23:11 total / 6 ranges               | +---------------------------------------------------+ |
|                                           | | # | Start        | End          | Voice | Actions| |
|                                           | |---|--------------|--------------|-------|--------| |
|                                           | | 1 | 00:00:02.100 | 00:00:05.400 | Lan   | Edit   | |
|                                           | | 2 | 00:00:08.050 | 00:00:12.990 | Lan   | Edit   | |
|                                           | +---------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------+
```

### Expanded row in edit mode

```text
+--------------------------------------------------------------------------------------------------+
| Range #3                                                                                         |
| Start [00:00:13.240         ] [Set Start]   End [00:00:17.880         ] [Set End]              |
| Voice [Lan v]   Emotion [Neutral v]                                                          |
| Transcription [..............................................................................] |
| Note          [..............................................................................] |
| Validation: Start time must be earlier than end time.                                          |
|                                                           [Cancel] [Save Range] [Delete]       |
+--------------------------------------------------------------------------------------------------+
```

### Key behaviors

- left sidebar keeps voice context visible
- clicking a voice filters or focuses new range creation for that voice
- `Add Range` inserts a draft row inline
- `Set Start` and `Set End` read from current paused player time
- delete uses instant delete plus undo toast
- per-voice totals appear in the voice list

### Mobile direction

For a later responsive version:

- stack sidebar above player
- collapse range list into cards
- keep edit actions sticky at bottom

## 2. Voice Management Screen

### Purpose

Manage voice profiles independently from annotation.

This screen supports:

- create voice
- edit voice
- delete voice
- inspect total duration and range count for each voice

### Layout

```text
+--------------------------------------------------------------------------------------------------+
| Voices                                                                 [ + New Voice ]           |
+--------------------------------------------------------------------------------------------------+
| Left panel: voice list                      | Right panel: voice form / detail                    |
|---------------------------------------------+-----------------------------------------------------|
| [Search voices.........................]    | Voice Name  [Hue female 01......................]   |
|                                             | Language    [Vietnamese..........................]   |
| > Hue female 01                             | Dialect     [Hue.................................]   |
|   Vietnamese / Hue / Female                 | Gender      [Female v............................]   |
|   24 ranges / 01:43:22                      |                                                     |
|                                             | [Save Voice] [Delete Voice]                        |
|   Quynh Anh                                 |                                                     |
|   Vietnamese / Hue / Female                 | Summary                                             |
|   6 ranges / 00:23:11                       | - Total duration: 01:43:22                         |
|                                             | - Total ranges: 24                                 |
|                                             | - Last updated: ...                                |
+--------------------------------------------------------------------------------------------------+
```

### Notes

- this can be a dedicated screen or drawer from annotation
- `gender` must come from the controlled vocabulary
- delete should be blocked or require reassignment if ranges already use the voice

## 3. Vocabulary Management Screen

### Purpose

Manage controlled vocabularies for:

- gender
- emotion

### Layout

```text
+--------------------------------------------------------------------------------------------------+
| Vocabularies                                                                                     |
+--------------------------------------------------------------------------------------------------+
| Tabs: [Gender] [Emotion]                                                                         |
+--------------------------------------------------------------------------------------------------+
| Left panel: entry list                      | Right panel: create/edit form                       |
|---------------------------------------------+-----------------------------------------------------|
| [Search entries.......................]     | Type: Gender                                        |
|                                             | Value [Female.................................]      |
| > Female                                    |                                                     |
| > Male                                      | [Save Entry] [Delete Entry]                         |
| > Unknown                                   |                                                     |
|                                             | Usage info                                          |
|                                             | - Used by 14 voices                                 |
|                                             | - Deletion blocked if in use                        |
+--------------------------------------------------------------------------------------------------+
```

### Emotion tab variant

```text
+--------------------------------------------------------------------------------------------------+
| Tabs: [Gender] [Emotion]                                                                         |
+--------------------------------------------------------------------------------------------------+
| Entries: Neutral, Happy, Sad, Angry, Excited, Other                                              |
+--------------------------------------------------------------------------------------------------+
```

### Notes

- keep this screen very simple
- show entry usage count if possible
- show clear warnings when delete is blocked because an entry is in use

## 4. Admin Voice List Screen

### Purpose

Separate screen for selecting a voice to review.

This is not role-based access control. It is simply a separate operational screen.

### Layout

```text
+--------------------------------------------------------------------------------------------------+
| Admin: Voices                                                                     [Back]         |
+--------------------------------------------------------------------------------------------------+
| Filters: [Language v] [Dialect v] [Gender v] [Search..........................] [Reset]         |
+--------------------------------------------------------------------------------------------------+
| +----------------------------------------------------------------------------------------------+ |
| | Voice Name     | Language   | Dialect | Gender | Ranges | Total Duration | With Transcript | | |
| |----------------|------------|---------|--------|--------|----------------|-----------------| | |
| | Hue female 01  | Vietnamese | Hue     | Female | 24     | 01:43:22       | 18              | | |
| | Quynh Anh      | Vietnamese | Hue     | Female | 6      | 00:23:11       | 5               | | |
| +----------------------------------------------------------------------------------------------+ |
|                                                                                                  |
| Click row to open voice detail                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Notes

- this screen is optimized for finding a voice quickly
- keep columns compact and sortable
- clicking a row opens the admin voice detail screen

## 5. Admin Voice Detail Screen

### Purpose

Review one voice in depth:

- all ranges
- summary metrics
- transcription coverage
- emotion distribution

### Layout

```text
+--------------------------------------------------------------------------------------------------+
| Admin: Voice Detail                                                          [Back to Voices]    |
+--------------------------------------------------------------------------------------------------+
| Voice: Hue female 01      Vietnamese / Hue / Female                                            |
| Total Duration: 01:43:22  Ranges: 24  With Transcript: 18  Without Transcript: 6               |
+--------------------------------------------------------------------------------------------------+
| Stats cards                                                                                        |
| [Total Ranges: 24] [Avg: 00:00:04.281] [Min: 00:00:01.100] [Max: 00:00:12.300]                 |
| [Neutral: 10] [Happy: 6] [Sad: 5] [No Emotion: 3]                                               |
+--------------------------------------------------------------------------------------------------+
| Filters: [Emotion v] [Transcription status v] [Video v] [Sort by v] [Search note/transcript]   |
+--------------------------------------------------------------------------------------------------+
| +----------------------------------------------------------------------------------------------+ |
| | # | Video      | Start        | End          | Duration   | Transcript | Emotion | Note     | |
| |---|------------|--------------|--------------|------------|------------|---------|----------| |
| | 1 | Hue TV 01  | 00:01:12.340 | 00:01:18.925 | 00:00:06.585 | Yes      | Neutral | Yes     | |
| | 2 | Hue TV 01  | 00:02:10.120 | 00:02:13.000 | 00:00:02.880 | No       | Happy   | No      | |
| +----------------------------------------------------------------------------------------------+ |
|                                                                                                  |
| [Open Selected Range] [Export Later]                                                             |
+--------------------------------------------------------------------------------------------------+
```

### Optional detail drawer

When a row is clicked:

```text
+--------------------------------------------------------------+
| Range Detail                                                 |
| Video: Hue TV 01                                             |
| Start: 00:01:12.340                                          |
| End:   00:01:18.925                                          |
| Duration: 00:00:06.585                                       |
| Voice: Hue female 01                                         |
| Emotion: Neutral                                             |
| Transcription: "...text..."                                  |
| Note: "...text..."                                           |
| [Open in Annotation Screen]                                  |
+--------------------------------------------------------------+
```

## Suggested Navigation

Simple top-level navigation:

```text
[Annotation] [Voices] [Vocabularies] [Admin]
```

Suggested flow:

- `Annotation` is default landing screen
- `Voices` manages voice profiles
- `Vocabularies` manages `gender` and `emotion`
- `Admin` opens the voice list screen

## Important UX Decisions Reflected Here

- annotation and admin review are separate screens
- annotation stays centered around the player
- range CRUD is inline, not modal-first
- delete is optimized for high-frequency use
- vocabulary editing is simple and operational
- admin review is table-based, not card-based

## Suggested Next Step

After this mockup stage, the next design artifact should be either:

1. a clickable low-fidelity wireframe in Figma
2. a frontend component map for implementation
3. a route-level app structure document
