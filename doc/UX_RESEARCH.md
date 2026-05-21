# UX Research: Range Creation, Editing, and Deletion

## Overview

This note captures the recommended UX for a YouTube-based annotation tool where extract ranges are frequent, lightweight, and often disposable.

The design goal is speed over ceremony. Users should be able to create, adjust, and remove ranges with minimal interruption while keeping attention on the video.

## Product Assumption

- Users create many ranges in a single session.
- Many ranges are experimental and may be deleted quickly.
- Precision matters, but the workflow should still feel fast.
- Users often switch attention between the player and the range list.

## Recommended UX Direction

Use inline range editing with instant creation and instant deletion plus undo.

This is a better fit than modal-based CRUD because:

- annotation is repetitive
- users need constant visual access to the player
- frequent confirmation dialogs would add friction
- ranges are disposable, so deletion should be reversible rather than blocked

## Recommended CRUD Model

### Create

Recommended behavior:

- Show a persistent `Add Range` button near the range list.
- Clicking `Add Range` immediately inserts a new draft row.
- The draft row should contain:
  - `start` field
  - `end` field
  - `Set Start` button
  - `Set End` button
  - `Save` action
  - `Cancel` action
- Move focus to the new row immediately.
- If possible, keep the new row visible without navigating away from the player.

Why:

- It keeps the interaction lightweight.
- It avoids unnecessary modal dialogs.
- It supports rapid, repeated range creation.

### Update

Recommended behavior:

- Existing ranges should be edited inline in the list.
- Default row state should show:
  - start
  - end
  - edit
  - delete
- Clicking `Edit` turns only that row into edit mode.
- In edit mode, show:
  - editable timestamp fields
  - `Set Start`
  - `Set End`
  - `Save`
  - `Cancel`
- Allow only one row in edit mode at a time.

Why:

- Inline editing is faster than navigating to another screen.
- One active edit row keeps the UI predictable.
- This reduces accidental edits across multiple rows.

### Delete

Recommended behavior:

- Clicking `Delete` removes the row immediately.
- Show a toast or inline notification with `Undo`.
- Keep undo available for 5 to 10 seconds.
- If the user clicks `Undo`, restore the deleted range in its previous position if feasible.

Why:

- Ranges are frequent and disposable.
- A confirmation dialog would slow down expert usage.
- Undo is safer without interrupting flow.

Not recommended for the basic version:

- blocking confirm modals for every delete
- multi-step delete flows

## Timestamp Capture UX

Because precise timing is central to the task, the fastest path to setting timestamps should be through the paused player.

Recommended behavior:

- `Set Start` and `Set End` should be prominent in edit mode.
- If the video is paused, clicking either button should apply the current playback time immediately.
- If the video is playing, pick one consistent rule:
  - automatically pause, then set
  - or disable the action until paused

Recommended default:

- automatically pause, then set

Why:

- It reduces user hesitation.
- It matches the intent behind clicking the button.
- It avoids forcing users into extra control steps.

## Validation UX

Validation should help the user recover quickly without feeling blocked.

Recommended behavior:

- Validate on save and whenever `Set Start` or `Set End` changes a field.
- Prevent saving when `start >= end`.
- Show validation inline on the affected row.
- Keep the message short and specific, such as:
  - `Start time must be earlier than end time.`
- Disable `Save` while the row is invalid.

Not recommended:

- global error banners for row-level problems
- modal error dialogs

## Layout Recommendation

For the basic version, place the player and range list in the same view.

Suggested structure:

- top or left: YouTube player
- adjacent panel: range list and controls
- each row: start, end, set buttons in edit mode, and quick actions

This reduces eye travel and supports quick pause-set-save loops.

## Interaction Principles

- Prefer inline actions over navigation.
- Prefer reversible actions over confirmation prompts.
- Keep the player visible during all range operations.
- Optimize for repeated use, not one-off editing.
- Make the most common actions the shortest path.

## Recommended Basic Version

For an initial release, the strongest UX baseline is:

- inline draft row creation
- inline single-row editing
- instant delete with undo
- one active edit row at a time
- prominent `Set Start` and `Set End`
- inline validation for `start < end`

## Risks and Tradeoffs

- Instant delete requires an undo mechanism to avoid accidental loss.
- Inline editing can become crowded if too many controls are shown at once.
- Auto-pausing on `Set Start` or `Set End` is efficient, but should be clearly consistent so it does not surprise users.

## Open Questions

- Should `Add Range` create a fully empty row, or should it prefill start and end from the current time?
- Should saving a range leave the user in neutral mode, or automatically create another draft row for rapid entry?
- Should delete undo restore the row exactly where it was, or simply re-add it to the end of the list?
