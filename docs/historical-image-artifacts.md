# Historical responsive-image artifact prototype

Historical images are compiled once with the normal Svelte/Vite enhanced-image
pipeline, stored in B2 as final immutable image assets plus a manifest, and
restored into later builds at the paths SvelteKit expects. Components reference
precomputed `Picture` metadata instead of asking Vite to regenerate those
images. This does not monkey-patch Vite: historical imports are removed from
the ordinary transform graph, while current and dynamic images continue through
`enhanced:img` normally.

B2 is private build-time storage, not a browser origin. SvelteKit copies the
restored assets into the deploy, and Netlify continues to serve every production
asset at its existing public URL.

## How it works

1. **Trusted generation:** an explicit command finds new or changed historical
   source/profile pairs and runs them through the repository's normal
   `enhanced:img` Vite plugins. It emits final AVIF/WebP/JPEG or PNG assets and
   the corresponding `Picture` metadata.
2. **Immutable publication:** the publisher verifies the output, uploads
   content-addressed assets and a versioned manifest under
   `historical-images/v1/`, then updates the publication pointer last.
3. **Ordinary restore:** local, Orb, PR, and Netlify builds only restore missing
   manifest-pinned assets into `static/_app/immutable/assets`. A verified local
   or Netlify build cache avoids repeat downloads and supports warm offline
   builds.
4. **Runtime maps:** generated TypeScript maps provide the exact source sets,
   dimensions, formats, and hashed URLs that the historical components would
   otherwise receive from `enhanced:img` imports.
5. **Normal live processing:** current-season (`2027`) and dynamic images stay
   in the ordinary Vite transform graph. Historical people originals continue
   to be copied byte-for-byte to `/images/people/**`.

This is **final build-asset caching**, not Vite's internal imagetools cache. It
stores deployable image bytes and public `Picture` metadata; it does not restore
Vite transform internals, intercept image requests, or depend on the separate
`feat/b2-enhanced-image-cache` experiment.

The reusable engine's config schema, lifecycle, and CLI are documented in
[Immutable image artifact engine](./image-artifact-engine.md). The rest of this
document covers the small Post Playhouse adapter and its qualification.

## Post Playhouse configuration and annual rollover

[`scripts/historical-images/postplayhouse.config.ts`](../scripts/historical-images/postplayhouse.config.ts)
is the application adapter. It reads the single `season` value, discovers
four-digit directories below `src/images/people` and `src/images/seasons`, and
archives every directory older than that value. The current directory remains
in literal generated Vite globs. Missing historical years are allowed; a future
year directory fails with an instruction to update the configured season first.
Exact lowercase extensions preserve the current exclusion of uppercase `.JPG`
files. Root-level historical files and the two raffle profile exceptions are
fixed adapter configuration, not annual work. Dynamic `/media` inputs are not
configured and continue through Vite normally.

Annual rollover is one deliberate source edit:

1. Change only `export const season = YYYY` in `src/data/seasons.ts`.
2. Run trusted generation with the previous manifest, review the changed set,
   then publish it. Generation automatically discovers the newly historical
   directories, regenerates historical metadata maps and literal current-year
   Vite globs, and derives the full site year list.
3. Commit the season value, generated modules, and new publication lock together
   after publication succeeds.

Developers do not edit source globs, runtime maps, manifests, or year lists by
hand. The remaining application-specific seams are this adapter, the generated
live-import module, the three image components that combine live and historical
maps, and the Netlify cache-persistence plugin.

## Trust and credential boundaries

The archive reuses the project's existing B2 bucket and configuration:

- `B2_BUCKET_ID`
- `B2_APPLICATION_KEY_ID`
- `B2_APPLICATION_KEY`

Historical artifacts are logically isolated under `historical-images/v1/`.
There is no dedicated historical bucket or credential isolation: the existing
key is shared with bio-submission tooling and may have write capability.
The ordinary restore command is nevertheless operationally read-only: it calls
only B2 authorization, list, and download APIs. Publication remains an explicit
trusted command and is never a build hook.

The transport verifies that the configured key can access `B2_BUCKET_ID`, that
any key name-prefix restriction permits `historical-images/v1/`, and that it
advertises `listFiles` and `readFiles`. Publication additionally requires
`writeFiles`. It does not require or use `deleteFiles`.

No real B2 access is needed for development. Set
`HISTORICAL_IMAGES_STORE_DIR=/absolute/path` to exercise the same protocol
against a local filesystem fixture.

## Data model and atomic publication

`historical-images/publication.v1.json` is a small repository lock. It pins one
immutable manifest object by SHA-256 and byte length. The manifest records:

- exact source path, source digest, transform profile, and transform identity;
- exact serialized `Picture` data used by Svelte;
- every public asset URL, digest, byte length, format, and dimensions;
- package, lockfile, Sharp/libvips, platform, and profile configuration identity.

`generatorRevision` is the publisher-code compatibility boundary described in
the generic engine document. Changing it intentionally invalidates all
transform keys.

Artifacts use `historical-images/v1/objects/<sha256>`. Manifests use
`historical-images/v1/manifests/<sha256>.json`. The publisher uploads and
verifies immutable objects first, then the immutable manifest, and updates
`historical-images/v1/latest.json` last. Ordinary builds ignore `latest.json`
and restore only the manifest pinned by the reviewed repository lock, avoiding
an unreviewed mutable deployment input.

An existing immutable name is accepted only when its bytes are identical. Old
objects are never deleted or rewritten. A failed publication leaves the old
repository lock and publication usable. Commit source changes, generated
runtime maps, and the new lock together only after publication succeeds.

## Commands

```sh
# Verify the exact 650-source / 652-profile discovery graph.
pnpm images:historical:discover

# Trusted generation. Output is intentionally ignored by Git.
SOURCE_DATE_EPOCH="$(git show -s --format=%ct HEAD)" \
  pnpm images:historical:generate --output .historical-images-output.ignore

# Incremental generation reuses unchanged Picture records and transforms only
# new or changed source/profile identities.
pnpm images:historical:generate \
  --previous .historical-images-output.ignore/manifest.v1.json \
  --output .historical-images-output.ignore

# Local/mock publication; safe and deterministic.
HISTORICAL_IMAGES_STORE_DIR=/tmp/postplayhouse-image-store \
  pnpm images:historical:publish --output .historical-images-output.ignore

# Trusted publication to the configured shared B2 bucket. The command writes
# only below historical-images/v1/.
pnpm with:1password pnpm images:historical:publish \
  --output .historical-images-output.ignore

# Ordinary operationally read-only restore and verification.
HISTORICAL_IMAGES_STORE_DIR=/tmp/postplayhouse-image-store \
  pnpm images:historical:restore
pnpm images:historical:verify
```

Source deletion is rejected unless generation receives `--allow-deleted`.
Pipeline identity changes regenerate every transform. Source edits and new
sources generate only their changed profiles. `.jpg` is canonical while a
byte-identical `.jpeg` alias is retained for warm-cache legacy URLs.

## Failure behavior and recovery

Restore verifies the repository lock, manifest digest and schema, complete
source inventory, pipeline identity, object digest/length, and image
format/dimensions. It installs each missing object through a temporary file and
atomic rename. Missing, stale, unavailable, or tampered data fails the build
with the trusted generation command; there is no historical Vite-transform
fallback.

The verified cache lives at `.cache/historical-images`. Netlify's build plugin
persists only this cache in `/opt/build/cache`; the plugin itself does not
access B2 or publish. A fully warm cache works offline. A cold cache fails
cleanly if B2 is unavailable. To recover, restore B2 connectivity or repopulate
the local cache from a verified store; never bypass verification or edit the
lock.

## Reproducible qualification

Use the existing 250 ms process-tree profiler with explicitly cold and warm
caches:

```sh
rm -rf .cache/historical-images static/_app/immutable/assets build .svelte-kit
node scripts/profile-build.mjs --output cold.json --csv cold.csv -- \
  pnpm run build:low-memory

rm -rf static/_app/immutable/assets build .svelte-kit
node scripts/profile-build.mjs --output warm.json --csv warm.csv -- \
  pnpm run build:low-memory
```

Capture output hashes, format/dimension inventories, people-original hashes,
prerendered `<picture>` structures, and apparent/allocated disk for baseline
and candidate builds:

```sh
pnpm exec tsx scripts/historical-images/evaluate.ts \
  --baseline /path/to/master/build \
  --candidate ./build \
  --output /tmp/historical-image-equivalence.json
```

Run `pnpm test:unit --run`, `pnpm check`, `pnpm lint`, and
`pnpm test:integration`. Browser qualification should load representative
people, season, production, raffle, and original-download URLs and verify
`currentSrc`, natural dimensions, source order, alt text, and classes.

## Prototype qualification results

Measured on the review Orb from master `6a610de5`, with the low-memory command
and 250 ms process-tree sampling:

| Path                   | Wall time |  Peak RSS | At least 90% peak |    Store transfer |
| ---------------------- | --------: | --------: | ----------------: | ----------------: |
| Master cold            |   41m 18s | 2.633 GiB |             33.6s |               n/a |
| Prototype cold         |    1m 59s | 1.683 GiB |             13.0s | 198,574,206 bytes |
| Prototype warm/offline |    1m 20s | 1.702 GiB |             16.1s |           0 bytes |

Cold and warm absolute-time, memory, and high-pressure targets pass. The 39.4s
(49.4%) cold/warm delta misses the 30s/10% target. Profiling attributes the
remaining cold work to responsive transforms outside this historical archive,
including dynamic media-gallery inputs; expanding this immutable archive to
those inputs is intentionally out of scope.

The successful full trusted generation took 36m 46s at 1.836 GiB peak. Its
deterministic unchanged incremental rerun took 3.6s at 579 MiB and reproduced
both manifest and runtime-map hashes. Local publication contains 4,032 unique
objects (198,574,206 bytes) and 5,268 public paths; the second publication
created zero objects and transferred zero bytes.

Against the retained master output, all 5,492 asset paths/hashes and
format/dimension inventory entries matched, all 880 prerendered `<picture>`
structures matched, and all 479 original people downloads were byte-identical.
The real-B2 transport qualification used the same securely injected project
bucket and credentials. Authorization advertised the required list, read, and
write capabilities for the configured bucket and permitted the archive prefix.
All transport methods reject names outside `historical-images/v1/`.

The first complete publication created 4,032 objects totaling 198,574,206
bytes. A transient B2 `503 no tomes available` interrupted the initial pass
after 1,868 immutable objects; because the manifest and pointer are written
last, no partial publication became current. The resumed pass verified and
reused those objects, created the remaining 2,164 (104,602,042 bytes), then
published the immutable manifest and pointer in 142.5s at 479 MiB process RSS.
The deterministic repeat verified/reused all 4,032 objects, uploaded zero
bytes, reproduced the manifest/publication IDs, and took 71.8s at 456 MiB.

A real cold restore downloaded 198,574,206 bytes and restored all 5,268 public
paths in 43.9s at 646 MiB process RSS. With neither credentials nor cache, the
same restore failed closed before building. Restoring the retained verified
cache while offline restored all paths with 4,032 cache hits and zero transfer
in 7.8s at 553 MiB. The downloaded `latest.json` pointer matched every field in
the repository lock and had the expected versioned publication ID. No unrelated
bucket object was overwritten or deleted.
