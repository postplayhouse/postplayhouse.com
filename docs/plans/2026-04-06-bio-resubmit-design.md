# Bio Edit & Resubmit Design

## Problem

People need to be able to edit their bios and resubmit at `/bio-submission`. Currently the page only supports first-time submissions.

## Solution

Add a new API endpoint that fetches existing bio data after passphrase authentication, and pre-fill the form with that data. The same page adapts based on whether existing data is found.

## New API Endpoint

### `GET /api/bio-submission/existing-bio`

- Accepts passphrase via `Authorization` header
- Derives position from passphrase index
- Uses GitHub API to check for `bio-update/position-{N}` branch first
  - If found: fetches YAML from that branch
  - If not found: fetches YAML from `master`
- Parses the YAML block between `# start __N__` / `# end __N__` markers
- Returns structured JSON with all form fields: `firstName`, `lastName`, `location`, `bio`, `programBio`, `roles`, `staffPositions`, `productionPositions`, `imageYear`, `imageFile`
- Also returns a `source` field (`"pr"` or `"master"`) so the frontend knows context

## Frontend Changes

### Auth flow (after passphrase confirmed)

1. Call `/api/bio-submission/existing-bio`
2. If data exists: pre-fill all form fields, transition to `incompleteForm`/`completeForm`
3. If no data (new person): proceed as today

### Field editability

All fields are editable: name, location, bio, roles, positions, headshot.

### Headshot handling for returning users

- Pre-select their current headshot via `image_year` + `image_file` from existing data
- Set `useOldHeadshot: true` and `oldImageSrcPath` to their current image path
- Adjust label copy for returning users (e.g., "Keep your current headshot" instead of "I've worked at Post before")

### Submission

Unchanged. Still POSTs to `/api/bio-submission/bio-to-gh`, which updates the existing PR branch with a new commit.

## What doesn't change

- Submission endpoints (bio-to-gh, notify, upload-url)
- YAML generation logic
- Validation rules
- B2 fallback flow
- GitHub PR creation/update logic
