# Historical responsive-image artifact architecture

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
4. **Server-side metadata:** a generated server-only map contains the exact
   source sets, dimensions, formats, and hashed URLs. Server loaders select only
   the records needed by each route; the complete map never enters browser
   bundles.
5. **Normal live processing:** current-season (`2027`) and dynamic images stay
   in the ordinary Vite transform graph. Historical people originals continue
   to be copied byte-for-byte to `/images/people/**`.

This is **final build-asset caching**, not Vite's internal imagetools cache. It
stores deployable image bytes and public `Picture` metadata; it does not restore
Vite transform internals, intercept image requests, or depend on the separate
`feat/b2-enhanced-image-cache` experiment.

### Storage decision

Checking final assets into Git would remove the cold-build credential and B2
availability dependency and would make rollback mechanically simpler. The
measured tradeoff is about 205 MB of unique binary growth and roughly a
0.9–1.0 GB Git pack, paid by clones and repository maintenance. The corrected
B2 design keeps those bytes content-addressed outside Git, gives ordinary builds
only a prefix-restricted read key, and supports verified offline cache/DR copies;
publisher credentials are never available to builds. B2 is therefore retained
as the default, conditional on the external key-scope, cache, rollback, and DR
qualification below. If those controls cannot be established, repository-backed
final assets are the safer fallback despite their size. A transparent/hybrid
Vite adapter remains rejected: it did not intercept enhanced-img literal loads
without a package patch and restored the large eager browser map.

The Svelte-specific infrastructure's config schema, lifecycle, and CLI are
documented in [Post Playhouse Svelte image artifact infrastructure](./image-artifact-engine.md).

## Post Playhouse configuration and annual rollover

[`scripts/historical-images/postplayhouse.config.ts`](../scripts/historical-images/postplayhouse.config.ts)
is the application adapter. It reads the single `season` value, discovers
four-digit directories below `src/images/people` and `src/images/seasons`, and
archives every directory older than that value. The current directory remains
in literal generated Vite globs. Missing historical years are allowed; a future
year directory fails with an instruction to update the configured season first.
Exact lowercase extensions preserve the current exclusion of upper-case `.JPG`
files. Root-level historical files and the two raffle profile exceptions are
fixed adapter configuration, not annual work. Dynamic `/media` inputs are not
configured and continue through Vite normally.

Annual rollover is one deliberate source edit:

1. Change only `export const season = YYYY` in `src/data/seasons.ts`.
2. Run `pnpm images:historical:stage`, review its plan and generated output,
   then publish it. Staging automatically discovers the newly historical
   directories, regenerates historical metadata maps and literal current-year
   Vite globs, and derives the full site year list.
3. Commit the season value, generated modules, and new publication lock together
   after publication succeeds.

Developers do not edit source globs, runtime maps, manifests, or year lists by
hand. The remaining application-specific seams are this adapter, the generated
live-import and news-reference modules, thin server loaders and image
components, and the Netlify cache-persistence plugin.

The complete historical map is generated beneath `$lib/server`. Prerendered
pages receive only their referenced `Picture` records. News references are
derived from page source during trusted generation. Bio submission lists stable
approved person/year IDs; its read-only server endpoint accepts one exact ID and
returns only that record's `Picture`, never an arbitrary path or the full map.
Current-season and dynamic images keep their existing client-visible
`enhanced:img` processing.

## Trust and credential boundaries

The repository defines three non-interchangeable credential contracts:

- ordinary restore: `HISTORICAL_IMAGES_READ_B2_*`;
- trusted publisher only: `HISTORICAL_IMAGES_PUBLISH_B2_*`;
- bio Functions/tooling only: existing `B2_*`.

| Contract             | Minimum B2 capabilities          | Name prefix                                                    | Netlify scope and context                                     |
| -------------------- | -------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------- |
| Historical read      | `listFiles,readFiles`            | `historical-images/v1/`                                        | Builds; production and explicitly trusted branch deploys only |
| Historical publisher | `listFiles,readFiles,writeFiles` | `historical-images/v1/` (or a disposable qualification prefix) | Never Netlify; explicitly invoked trusted tooling only        |
| Bio runtime          | `writeFiles`                     | Existing bio-upload namespace (currently bucket-root names)    | Functions; production runtime only                            |

Trusted offline bio audit tooling additionally needs `listFiles,readFiles`, but
those credentials are injected only into that tool process and are not a Build
variable. Deploy previews and fork/PR contexts receive none of the three
contracts unless the repository is trusted and the context has been explicitly
approved.

The read key must be bucket-restricted and name-prefix-restricted to
`historical-images/v1/`, with only `listFiles` and `readFiles`. The publisher
adds `writeFiles` but not `deleteFiles`, and must never be present in Netlify
Builds. Bio variables are Functions-scoped. Ordinary code never falls back to
either write credential. A warm no-secret build works; a cold one fails closed.

The transport verifies that each dedicated key can access its configured bucket,
that its name-prefix restriction permits `historical-images/v1/`, and that it
advertises the purpose-specific capabilities. Publication does not require or
use `deleteFiles`.

No real B2 access is needed for development. Set
`HISTORICAL_IMAGES_STORE_DIR=/absolute/path` to exercise the same protocol
against a local filesystem fixture.

## Data model and atomic publication

`historical-images/publication.v1.json` is a readable repository lock. It pins
the immutable manifest, every app-consumed generated module, narrow pipeline
and source identities, counts, unique bytes, source/profile
additions/removals/changes, and public-path additions/removals.
The manifest records:

- exact source path, source digest, transform profile, and transform identity;
- exact serialized `Picture` data used by Svelte;
- every public asset URL, digest, byte length, format, and dimensions;
- byte-affecting package, exact Node/Sharp/libvips, platform, profile, and
  generator-source identity. Unrelated lockfile edits do not invalidate it.

`generatorRevision` is an explicit protocol boundary. Profiles, generator
sources, and byte-affecting package identities are also hashed automatically;
changing any of them invalidates transform keys.

The v2 lock is also a reviewed migration attestation for its exact v1 manifest:
when `hydrate-generation` supplies that byte-identical manifest and the lock's source and
pipeline digests still match, generation may carry forward unchanged Pictures
while rewriting their transform keys to the current protocol. Any manifest,
source, profile, package, or generator mismatch disables that bridge and forces
regeneration. This avoids a one-time 650-source rebuild without turning
`generatorRevision` or a marker string into an invalidation override.

Artifacts use `historical-images/v1/objects/<sha256>`. Manifests use
`historical-images/v1/manifests/<sha256>.json`. The publisher uploads and
verifies immutable objects first, then the immutable manifest, and updates
`historical-images/v1/latest.json`. It then atomically replaces the local lock
with temp-file-plus-rename. B2 and the filesystem cannot form one transaction:
`latest` can advance if the rename fails, but ordinary builds ignore it and the
old lock remains usable. No stronger atomicity claim is made. Ordinary builds ignore `latest.json`
and restore only the manifest pinned by the reviewed repository lock, avoiding
an unreviewed mutable deployment input.

An existing immutable name is accepted only when its bytes are identical. Old
objects are never deleted or rewritten. A failed publication leaves the old
repository lock and publication usable. Commit source changes, generated
runtime maps, and the new lock together only after publication succeeds.

For B2, one paginated `b2_list_file_names` inventory returns B2's
server-computed content SHA-1 and length. The publisher has already verified the
local candidate by SHA-256 and length; matching server SHA-1/length therefore
avoids downloading every unchanged object on a repeat publication. Missing
metadata or any mismatch falls back to a full download and byte comparison,
then fails on collision. The SHA-256-named object and manifest remain the
restore trust boundary: every downloaded byte is checked by SHA-256 and length.

## Commands

```sh
# Verify the exact 650-source / 652-profile discovery graph.
pnpm images:historical:discover

# Offline, non-mutating readiness diagnostics. Counts are explicitly unverified.
pnpm images:historical:doctor

# Read-only plan for an already hydrated publisher workspace. It never hydrates,
# encodes, publishes, edits the lock, or accepts deletion.
pnpm images:historical:plan

# Trusted staging: hydrate the reviewed manifest, print the plan, then generate
# with the default output/previous paths and deterministic Git timestamp.
pnpm images:historical:stage

# Local/mock publication; safe and deterministic.
HISTORICAL_IMAGES_STORE_DIR=/tmp/postplayhouse-image-store \
  pnpm images:historical:publish

# Trusted publication using only dedicated publisher variables. Never run this
# in an ordinary build or with bio/read credentials.
pnpm with:1password pnpm images:historical:publish

# Ordinary operationally read-only restore and verification.
HISTORICAL_IMAGES_STORE_DIR=/tmp/postplayhouse-image-store pnpm images:historical:restore
```

`restore` is the single canonical verified installation workflow. `prepare` and
`verify` remain compatibility aliases for `hydrate-generation` and `restore`.
Source deletion is rejected unless the reviewed stage receives
`--allow-deleted`; plan prints the exact acknowledgement guidance.
Pipeline identity changes regenerate every transform. Source edits and new
sources generate only their changed profiles. `.jpg` is canonical while a
byte-identical `.jpeg` alias is retained for warm-cache legacy URLs.

## Failure behavior and recovery

Restore verifies the lock, manifest digest/schema, recomputed source and
pipeline identity, generated-module digest/length, and every object
digest/length. It installs through temp-file/rename and prunes only paths in its
artifact-owned restore ledger. Symlinked owned roots are rejected; unrelated
static/Vite outputs remain untouched. Missing, stale, unavailable, or tampered data fails the build
with the trusted generation command; there is no historical Vite-transform
fallback.

The verified cache lives at `.cache/historical-images`. `hydrate-generation` reconstructs
a complete previous output before incremental generation, covering additions,
changes, acknowledged deletion, rename (delete+add), annual rollover, resume,
and rollback without retaining a developer's ignored output. Netlify's build plugin
persists only this cache in `/opt/build/cache`; the plugin itself does not
access B2 or publish. A fully warm cache works offline. A cold cache fails
cleanly if B2 is unavailable. To recover, restore B2 connectivity or repopulate
the local cache from a verified store; never bypass verification or edit the
lock.

B2 names are versioned conventions, not object-lock. Hash mismatch fails closed.
Retain old manifests/versions and a second verified cache copy; enable provider
retention/object lock where available. For B2 loss, seed a filesystem store from
that copy, run `hydrate-generation`, collision-verify and republish under explicit
authorization, then review the new lock. Roll back by reverting sources,
generated modules, and lock together.

Generation is supported only on pinned Linux/x64. macOS may run `restore` and
`hydrate-generation` because final-byte copying does not invoke libvips; it must not publish
or claim byte-reproducible generation. Linux CI requalifies toolchain changes.

## Reproducible qualification

Use the existing 250 ms process-tree profiler with explicitly cold and warm
caches:

```sh
rm -rf .cache/historical-images static/_app/immutable/assets build .svelte-kit
# Keep node_modules/.cache/imagetools identical in both runs, or clear it before
# both, so current/dynamic transforms are not silently warmer in one sample.
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

Acceptance budget: at most `ceil(objects/1000)` object inventory-list requests
(plus the pinned manifest lookup); one download per cold unique object
(currently 4,032 / 198,574,206 bytes); zero warm transfer; at most eight
concurrent object operations; restore cold/warm delta ≤30 seconds and ≤10%;
total-build peak RSS below 1.8 GiB. A repeat publication should inventory the
4,032 objects in about five list pages and download no matching object bodies.
Record restore-only and total-build wall/RSS separately.

## External qualification (not performed by repository tests)

1. In **Backblaze Console → App Keys → Add a New Application Key**, create a key
   restricted to the production bucket and name prefix `historical-images/v1/`
   with only `listFiles,readFiles`. Create a separate trusted-publisher key for
   the same bucket/prefix with `listFiles,readFiles,writeFiles` and no delete
   capability. Record key IDs and values securely, then use
   `pnpm images:historical:restore` and a disposable-prefix publish only under
   explicit authorization. Verify wrong bucket, prefix, and capabilities fail.
2. In **Netlify → Site configuration → Environment variables**, create the
   three `HISTORICAL_IMAGES_READ_B2_*` values with **Builds** scope only for
   trusted production and trusted branch contexts. Create the three existing
   `B2_*` values with **Functions** scope only. Never add
   `HISTORICAL_IMAGES_PUBLISH_B2_*` to Netlify. The equivalent reviewed CLI
   shape is `netlify env:set NAME --scope builds --context production` for each
   read variable and `netlify env:set NAME --scope functions --context
production` for each bio variable; enter values interactively or through the
   team's secret manager, never command history. Untrusted forks/PRs receive no
   secrets and must use a preseeded verified cache or fail closed before Vite.
3. Exercise cold/warm production cache, cache clear, new branch, trusted PR,
   untrusted no-secret PR, plugin hook order, and failure before postbuild.
   Confirm cache isolation and function-only bio variables.
4. With separate explicit authorization, optionally publish a disposable
   prefix and test interruption/resume, collision/tamper failure, rollback,
   prior-version recovery, and second-copy reconstruction. Repository
   qualification performs no real B2 writes or deletes.

## Current repository qualification results

The production credentials and Netlify settings were deliberately not used.
Against a filesystem read store made from the independently SHA-256-verified
warm cache, a fresh cache/static restore copied 5,268 paths from 4,032 objects
(198,574,206 unique bytes) in 9.63s at 425,108 KiB RSS. Repeating offline after
removing only static artifacts used 4,032 cache hits, transferred zero bytes,
and took 8.04s at 537,784 KiB RSS. The 1.59s absolute delta passes the 30s
budget; the 19.8% relative delta does not pass the 10% budget. A no-op verified
restore took 6.17s at 508,936 KiB RSS.

A controlled local build cleared `node_modules/.cache/imagetools` for both exact
master `6a610de5` and this candidate. Master took 2,322.517s (38m 42.5s) at
2,852,995,072 bytes (2.657 GiB) peak process-tree RSS. Two candidate runs took
105.700s at 1,854,717,952 bytes (1.727 GiB) and 102.000s at 1,936,924,672 bytes
(1.804 GiB). Wall time improved by about 95.5%; peak RSS improved by 32.1–35.0%.
The second run exceeded the 1.8 GiB RSS budget by about 4 MiB, so the budget is
not consistently met. The bidirectional evaluator found 5,492 assets, 479
people originals, and 880 Pictures on each side, with no missing, extra, or
changed entries. A prior 135.432s candidate run was rejected because its
current/dynamic imagetools cache was warm while master's was cold.

Fresh `prepare` reconstructed all 5,268 paths from the reviewed cache in 7.99s
at 477,100 KiB RSS, without retained ignored output or network access. The v1 to
v2 migration bridge then reused all 652 source/profile results only after the
tracked v2 lock attested the exact old manifest, source set, and new pipeline.
It produced 5,268 assets backed by the same 4,032 objects without encoding.

## Inherited prototype evidence (not re-run against B2 or Netlify)

The source prototype reported the following measurements from master
`6a610de5`, using the low-memory command and 250 ms process-tree sampling. They
are historical context, not current real-B2 or Netlify qualification:

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
The source work also reported a real-B2 transport qualification using securely
injected project credentials. That external claim was not repeated for the
current repository changes. Repository tests do verify capability, bucket,
prefix, retry, timeout, authorization-expiry, batching, and collision behavior
with realistic mocked responses.

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
