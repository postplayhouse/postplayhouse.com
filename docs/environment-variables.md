# Environment variables and 1Password

Varlock is the repository's environment-variable contract. [`.env.schema`](../.env.schema)
documents every value read or set by the application and tooling, validates supplied
values, and marks values public or sensitive. It contains no application secret values.

## Command boundaries

- `pnpm env:check` validates local configuration and is safe without application secrets;
  `pnpm env:audit` checks that code usage and the schema remain aligned.
- `pnpm check`, `pnpm test:unit --run`, and secret-free bio commands do not fetch secrets.
- `pnpm dev` and `pnpm build` validate values that are present but do not require all
  production credentials. A credentialed endpoint still fails if its own credential is
  absent when exercised.
- `pnpm bio:fetch`, `pnpm bio:emails`, and `pnpm bio:audit-b2` validate through Varlock;
  their existing runtime checks require only the credentials they use.
- `pnpm bio:basecamp` requires the write-capable `BASECAMP_TOKEN`. Its two public project
  names default to the current 2026 names in the schema.
- `pnpm env:check:production` requires production runtime values already in the process.
- `pnpm env:check:1password` fetches Environment `fd2j6ly53dbub7h4rcovbjmtc4` and validates
  it as production. `pnpm with:1password <command>` fetches it and runs a command.
- Netlify runs `pnpm netlify`, which validates production configuration before tests,
  typecheck, and build.

`GITHUB_ACCESS_TOKEN` is the application token used by SvelteKit server routes.
`GITHUB_TOKEN` is a separate optional token recognized by the `gh` CLI in bio tooling.
They are not aliases; use the same value only if one least-privilege token safely serves
both roles.

## 1Password Environment integration

The project uses 1Password Environment ID `fd2j6ly53dbub7h4rcovbjmtc4`. The committed
[`.env.1password`](../.env.1password) contains that ID and Varlock plugin instructions,
not secret values. `@varlock/1password-plugin` is pinned in `package.json`. With a service
account, the plugin reads the Environment through the 1Password SDK, so it does not need
the beta-only `op run --environment` CLI feature.

Keep these variable names exact in the Environment:

| Group                     | Variables                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Shared B2/build/runtime   | `B2_BUCKET_ID`, `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`                                                      |
| Other production runtime  | `GITHUB_ACCESS_TOKEN`, `BASECAMP_BIO_BOT_INTEGRATION_KEY`, `NETLIFY_WEBHOOK_SECRET`, `INDIVIDUAL_PASSPHRASES_LIST` |
| Optional build/tooling    | `SENTRY_AUTH_TOKEN`, `GITHUB_TOKEN`, `BASECAMP_TOKEN`                                                              |
| Optional public overrides | `BASECAMP_CALL_BOARD_PROJECT`, `BASECAMP_PRODUCTION_PROJECT`                                                       |

The schema supplies the Basecamp project-name defaults, so storing those two public values
is optional. Store `INDIVIDUAL_PASSPHRASES_LIST` as one ordered comma-separated value;
changing order changes bio position numbers. Do not put `OP_SERVICE_ACCOUNT_TOKEN` inside
the Environment: it is the secret zero used to access the Environment.

This single Environment includes unrelated credentials, including the write-capable
`BASECAMP_TOKEN`. It is convenient for explicit full validation but broader than ideal for
routine commands. Any future 1Password Environment split must keep the three `B2_*`
values as one shared B2 credential contract; the accepted project design does not create
read-, publisher-, or bio-specific B2 credentials. Other secrets may still be separated:

1. **postplayhouse-runtime-build** — shared B2 and production runtime variables.
2. **postplayhouse-basecamp-write** — `BASECAMP_TOKEN` and project names only.

If split, add committed reference files containing only each Environment ID and use the
matching file/service account for each command. Until then, do not use the all-variable
Environment for untrusted jobs or routine agent sessions.

## Exact local hookup

### Human development (preferred)

Use the 1Password desktop app's Environment local-file destination so a service-account
token is not stored on a developer machine:

1. Open **Developer → Environments**, select the project Environment, and add a local
   destination for this checkout at `.env.local`.
2. Keep 1Password unlocked while working. `.env.local` is ignored by Git.
3. Validate and run normally:

   ```bash
   pnpm install --frozen-lockfile
   pnpm env:check
   pnpm dev
   ```

Do not print, copy, or commit the mounted file. Remove the destination in 1Password when
the checkout is retired.

### Service-account access (headless local or trusted automation)

Create a read-only service account scoped only to Environment
`fd2j6ly53dbub7h4rcovbjmtc4`. Put its token in the process environment using a secure
credential facility; never pass it as a command-line argument or write it to a file:

```bash
test -n "$OP_SERVICE_ACCOUNT_TOKEN"
pnpm env:check:1password
pnpm with:1password pnpm dev
```

Varlock marks `OP_SERVICE_ACCOUNT_TOKEN` sensitive and internal. It is available to the
plugin but removed before the child command starts. Application values are redacted in
Varlock's diagnostic output. Unset the token after the session.

The 1Password CLI's `op run --environment` and `op environment read` remain beta-only even
though current stable CLI versions are numerically newer than the documented minimum.
Do not assume stable `op` supports those flags. The repository integration deliberately
uses the pinned Varlock plugin and SDK instead.

## Netlify and trusted CI

Netlify already supplies build and function environment variables. Keep the existing names
in **Site configuration → Environment variables**, with runtime values available to
Functions and `SENTRY_AUTH_TOKEN` available to Builds. Do not add local-only
`BASECAMP_TOKEN` or Basecamp project names. `pnpm netlify` fails before build when required
production values are missing or malformed, so Netlify does not need 1Password access.

For trusted CI that intentionally resolves from 1Password:

1. Create a service account with **read-only access to only the required Environment**.
2. Store its token as the protected, masked secret `OP_SERVICE_ACCOUNT_TOKEN`.
3. Do not expose it to fork/untrusted pull requests; use branch/environment protections.
4. Install with the lockfile and validate before the secret-bearing operation:

   ```bash
   pnpm install --frozen-lockfile
   test -n "$OP_SERVICE_ACCOUNT_TOKEN"
   pnpm env:check:1password
   pnpm with:1password pnpm netlify
   ```

The service-account token is the secret zero. Rotate it independently, revoke it when the
automation is removed, and never save it in this repository, 1Password Environment, build
artifact, cache, or log.

## Amp Orbs

An Orb is an ephemeral development machine, not automatically a trusted secret boundary.
Do not add a personal 1Password session, desktop integration, account password, or broad
service account to arbitrary Orbs. Keep project pre-setup secret-free: install the pinned
Node/pnpm dependencies and run only secret-free setup.

Commands such as `pnpm env:check`, `pnpm env:audit`, `pnpm check`, unit tests, lint, and
format need no 1Password access. A development server and ordinary build can start without
application secrets, although credentialed endpoints cannot call providers.

For an explicitly trusted Amp project, store a narrowly scoped read-only service-account
token as the Amp project secret `OP_SERVICE_ACCOUNT_TOKEN`, refresh/restart the Orb so the
process receives it, and run only the explicit command:

```bash
test -n "$OP_SERVICE_ACCOUNT_TOKEN"
pnpm env:check:1password
```

The current service account can read an Environment containing B2/GitHub/Basecamp write
credentials, so it is too broad for normal review Orbs. Remove the Amp project secret and
revoke/rotate the token after this validation unless ongoing dynamic resolution is an
intentional project policy. Prefer direct, narrow Amp project secrets or split Environments
for future targeted integration tests. Never run `pnpm bio:basecamp` in an Orb without
specific human approval; it can add or invite users.

The current shared Amp pre-setup also calls nonexistent `pnpm cache:images:restore`.
Confirm that stale line separately before changing shared project configuration.
