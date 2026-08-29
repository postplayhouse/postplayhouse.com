# Enhanced-image cache

This repository stores only `node_modules/.cache/imagetools/**` in a portable,
versioned archive in the existing private Backblaze B2 bucket `postplayhouse`.
The old loose-file prefix (`cache/node_modules/.cache/imagetools`) is not read or
modified.

## Access and commands

`pnpm cache:images:restore` is safe for ordinary development, Netlify builds,
and Amp Orbs. It is read-only and exits successfully with a cold cache when
credentials are absent, an object is missing, B2 is unavailable, another local
restore holds the lock, or validation fails.

Give these environments a B2 application key limited to **list/read only** for
the bucket and the prefix `cache/enhanced-image/v1/`:

- `B2_CACHE_READ_APPLICATION_KEY_ID`
- `B2_CACHE_READ_APPLICATION_KEY`

`pnpm cache:images:publish` is intentionally separate. Run it only in trusted
CI or a trusted manual environment after a successful build. It requires a
different key limited to **list/read/write** for that same prefix:

- `B2_CACHE_WRITE_APPLICATION_KEY_ID`
- `B2_CACHE_WRITE_APPLICATION_KEY`
- `B2_BUCKET_ID` (the existing shared identifier for the `postplayhouse` bucket)

Do not expose publisher variables to pull requests, ordinary Orbs, deploy
previews, or untrusted branches. Do not reuse the existing bio-submission B2
credentials. Secret values belong in Amp project secrets or trusted CI secret
settings, never in the repository.

## Identity, validation, and invalidation

The namespace includes SHA-256 identities for exact enhanced-img,
vite-imagetools, imagetools-core, Sharp/libvips, Node major, OS/architecture,
`pnpm-lock.yaml`, `vite.config.ts`, every source file containing enhanced-image
configuration/directives, and the path plus content of every source image under
`src/` and `static/`. Downloaded transient files under `cache.ignore` are
excluded because they do not exist during setup.

Each archive contains `manifest.json` and only the imagetools cache. Restore
checks the pointer identity, archive size and SHA-256, safe tar paths and entry
types, limits, manifest compatibility, and every file's size and SHA-256 before
merging through a temporary directory. A failed check leaves the existing cache
alone. To force invalidation beyond these inputs, increment
`CACHE_FORMAT_VERSION` in `cache.ts`; this creates a new namespace.

Publish creates a content-addressed immutable archive, uploads it, and only then
updates that identity's `latest.json`. Readers therefore see either the old
complete publication or the new complete publication. Concurrent publishers
may upload the same immutable content safely; the last valid pointer wins.

## Seed or refresh the shared cache

In a trusted environment with publisher variables:

```sh
pnpm install --frozen-lockfile
rm -rf node_modules/.cache/imagetools # optional clean seed
pnpm build
pnpm cache:images:publish
```

Then test with read-only variables in a clean checkout:

```sh
pnpm install --frozen-lockfile
pnpm cache:images:restore
pnpm build
```

Publishing is never automatic. A source/config/lockfile/toolchain change gets a
new key and cold fallback until a trusted environment publishes it.
