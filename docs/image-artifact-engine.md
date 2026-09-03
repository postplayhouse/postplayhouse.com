# Post Playhouse Svelte image artifact infrastructure

The prototype engine compiles configured source directories once with Vite,
stores the final deployable assets and metadata in an artifact store, and
restores verified files into later builds. The archive/store protocol is
configuration-driven, but generation intentionally depends on Svelte, Vite,
`@sveltejs/enhanced-img`, and the project's `Picture` type. It is not presented
as an application-agnostic engine.

This is final build-asset caching, not Vite's internal imagetools cache. Archived
imports leave the ordinary Vite graph entirely. The engine neither patches Vite
nor intercepts browser requests; an application keeps using its normal pipeline
for inputs that are not configured as archived sources.

## Configuration

A config module default-exports an `ArtifactConfigProvider`. Its `load` method
returns an `ArtifactConfig`:

```ts
export default {
	async load(root) {
		return {
			identity: "example-catalog-v1",
			schemaVersion: 1,
			generatorRevision: 1,
			storePrefix: "image-artifacts/example/v1",
			lockPath: "artifacts/publication.v1.json",
			generatedMetadataPath: "src/generated/artifact-pictures.ts",
			generatedOutputPaths: ["src/generated/artifact-pictures.ts"],
			pipelineSourcePaths: ["scripts/generator.ts"],
			staticAssetRoot: "static/_app/immutable/assets",
			cacheRoot: ".cache/image-artifacts",
			publicAssetPrefix: "/_app/immutable/assets/",
			trustedPublishCommand: "pnpm artifacts:publish",
			profiles: {
				card: {
					query: { enhanced: true, w: "400;800" },
					srcsetDescriptors: "width",
				},
			},
			sources: [
				{
					id: "catalog",
					directory: "src/catalog",
					logicalPrefix: "catalog/",
					profile: "card",
					collection: "catalogPictures",
					extensions: ["jpg", "png"],
					recursive: true,
				},
			],
			profileExceptions: [],
		}
	},
}
```

Each source maps files beneath `directory` to stable metadata keys beneath
`logicalPrefix`, using one named transform profile and generated TypeScript
`collection`. Extensions are exact and case-sensitive. Sources may be recursive.
A profile exception adds another transform/collection for one discovered file;
it does not encode application semantics in the engine.

Validation rejects unsafe paths, duplicate source IDs, unknown profiles,
missing directories, missing exception targets, and generated metadata-key
collisions. `identity` distinguishes one complete declarative source mapping.
Profiles and the configured generator source files are hashed automatically.
The byte-affecting package versions, exact Node/Sharp/libvips identities, and
platform are recorded in the manifest. An unrelated `pnpm-lock.yaml` edit does
not invalidate an archive. `generatorRevision` remains an explicit protocol
boundary, not a substitute for hashing implementation and profile inputs.
Only byte-transform sources belong in `pipelineSourcePaths`. Presentation-only
metadata formatting remains authenticated as a generated output in the
repository lock, but does not invalidate image transforms.

A provider may implement `afterGenerate` for a thin application adapter, such
as regenerating a framework-specific live-import module. This hook is not part
of discovery, transformation, publication, or restore.

## Commands and lifecycle

Every command accepts `--config path/to/config.ts`; omitting it selects the Post
Playhouse adapter.

```sh
tsx scripts/historical-images/index.ts discover --config path/to/config.ts
tsx scripts/historical-images/index.ts doctor --config path/to/config.ts
tsx scripts/historical-images/index.ts hydrate-generation --config path/to/config.ts \
  --output .artifact-output
tsx scripts/historical-images/index.ts plan --config path/to/config.ts \
  --previous .artifact-output/manifest.v1.json
tsx scripts/historical-images/index.ts stage --config path/to/config.ts
tsx scripts/historical-images/index.ts publish --config path/to/config.ts \
  --output .artifact-output
tsx scripts/historical-images/index.ts restore --config path/to/config.ts
```

`discover` hashes and inventories configured files. `doctor` is offline and
non-mutating. `hydrate-generation` hydrates the lock-pinned previous manifest
and assets from a verified cache/read store, so a fresh publisher does not need
a retained ignored output directory. `plan` compares an already hydrated
manifest without encoding or mutation. `stage` hydrates, prints that plan, and
transforms only new or changed source/profile identities using deterministic
defaults. Deletions stop staging unless explicitly acknowledged with
`--allow-deleted`. The old `prepare` and `verify` entry points remain
compatibility aliases, and low-level `generate` remains available for existing
automation. Restore is the canonical static installation workflow.

`publish` verifies local assets, writes content-addressed objects, writes the
immutable manifest, and updates the mutable pointer last. Existing immutable
names must contain identical bytes. `restore` ignores that pointer and uses the
repository lock to fetch only missing objects. Every manifest and object is
checked by digest, length, schema, source inventory, and authenticated generated
module identity before installation. Image metadata is authenticated from the
trusted Linux generation manifest; portable restore only copies digest-verified
bytes and does not invoke libvips. A verified local cache supports offline
warm restores; unavailable cold storage fails closed.

The generic store contract is implemented by the filesystem mock and B2
transport. B2 names are constrained to the configured prefix. B2 remains a
build-time store, never a browser or production-serving origin.
