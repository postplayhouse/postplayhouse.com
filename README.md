# Post Playhouse

Environment variables are declared and validated with Varlock. See
[Environment variables and 1Password](docs/environment-variables.md) before
running application, deploy, or bio-tool commands that need credentials.

Looking to create new passphrases for bio submissions?

```bash
pnpm gen:phrases
```

## Development

Install the pinned Node/pnpm toolchain and dependencies, then run:

```bash
pnpm install --frozen-lockfile
pnpm env:check
pnpm dev
```

Historical build assets are intentionally not stored in Git. A fresh clone needs
either a preseeded, verified `.cache/historical-images` or the shared
`B2_BUCKET_ID`, `B2_APPLICATION_KEY_ID`, and `B2_APPLICATION_KEY`
configuration before `dev` or `build` can restore them. By explicit project
decision, historical images and bio tooling share these credentials; there is
no credential-level isolation or least-privilege claim between those uses.
Setup does not silently download these assets. Run
`pnpm images:historical:doctor` to inspect local readiness without network
access, then `pnpm images:historical:restore` explicitly if needed. Endpoints
that call other external services need only their corresponding credentials.

## End-to-end tests

Install the Playwright Chromium build once, then run the integration suite:

```bash
pnpm exec playwright install chromium
pnpm test:integration
```

Playwright starts the local SvelteKit build and preview server on port 3000. The
current end-to-end suite does not use Docker or any external service, so Docker
is not a prerequisite. If a future test adds a container dependency, its Docker
preflight belongs with that test rather than the general repository setup.

The Playwright server uses `pnpm build:low-memory`. That build disables local
source-map upload, limits Node to a 1.75 GiB heap, and serializes Sharp/libvips
image work so it fits a small CI/orb environment. Use ordinary `pnpm build` for
production builds with Sentry source-map upload.

## create-svelte reference

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/main/packages/create-svelte).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npm create svelte@latest

# create a new project in my-app
npm create svelte@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
