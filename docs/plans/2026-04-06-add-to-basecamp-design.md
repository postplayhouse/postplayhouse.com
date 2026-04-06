# Design: Add People to Basecamp Projects

**Date:** 2026-04-06

## Overview

A script that reads the 2026 people YAML, determines who belongs in each Basecamp project, matches them against existing Basecamp account members, and adds them — using existing accounts where available and email invitations where not.

## Auth

Requires a new `BASECAMP_TOKEN` env var in `.env`: a standard OAuth bearer token from Basecamp. The existing `BASECAMP_BIO_BOT_INTEGRATION_KEY` only works for Campfire chat posts and cannot access the people/projects API.

Obtain the token once from `https://launchpad.37signals.com/integrations` (register or use an existing OAuth app, run the auth flow, store the resulting access token in `.env`).

Basecamp account ID `5732828` is already known from `src/routes/api/basecamp.server.ts`.

## People Filtering

From `src/data/people/2026.yml`:

- **Virtual Call Board 2026:** Everyone whose `groups` array does NOT consist solely of `board`. Includes performers, musicians, on-site and remote staff. Excludes pure board-only entries.
- **Production Staff 2026:** Everyone with a `staff_positions` entry.

## Script Location

`scripts/bio-tool/add-to-basecamp.ts` — follows the existing bio-tool script pattern (imports `./lib/env`, uses `js-yaml`, reads from `lib/manifest.ts` for emails).

## Flow

1. Load and parse `2026.yml` with `js-yaml`, apply both filters
2. `GET /people.json` — fetch all existing Basecamp account members (handle pagination)
3. `GET /projects.json` — find "Virtual Call Board 2026" and "Production Staff 2026" by name to get their IDs
4. For each project, partition the target people into:
   - **grant:** matched by full name (`first_name + last_name`) to an existing Basecamp person → collect Basecamp ID
   - **create:** not found in Basecamp → look up email from manifest (`bio-tool.ignore/emails.json`) → `{ name, email_address }`
   - **skipped:** not in Basecamp and no email in manifest → warn
5. Print full plan: who gets granted, who gets invited, who gets skipped
6. Prompt: `Proceed? (y/N)` — exit without making changes if not confirmed
7. `PUT /projects/{id}/people/users.json` with `{ grant: [...ids], create: [...{name,email}] }` for each project
8. Print summary: who was granted, who was invited, who was skipped

## API Endpoints Used

All under `https://3.basecampapi.com/5732828/`:

- `GET /people.json` — list all account people
- `GET /projects.json` — list all projects (to find IDs by name)
- `PUT /projects/{id}/people/users.json` — grant/create access

## Error Handling

- Missing `BASECAMP_TOKEN`: throw immediately with a helpful message pointing to `.env`
- Project name not found: throw with the name that was missing
- API errors: surface the HTTP status and response body
- People with no Basecamp match and no manifest email: warn and skip (do not abort)
