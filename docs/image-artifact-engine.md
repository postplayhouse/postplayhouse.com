# Immutable image artifact engine

The prototype engine compiles configured source directories once with Vite,
stores the final deployable assets and metadata in an artifact store, and
restores verified files into later builds. It is application-agnostic: the core
does not know about Post Playhouse seasons, people, productions, or raffles.

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
`generatorRevision` must change when engine behavior could alter bytes or
metadata. The optional profile-configuration digest override exists only to
migrate an already-qualified compatible publication; new configurations should
let the engine derive it.

A provider may implement `afterGenerate` for a thin application adapter, such
as regenerating a framework-specific live-import module. This hook is not part
of discovery, transformation, publication, or restore.

## Commands and lifecycle

Every command accepts `--config path/to/config.ts`; omitting it selects the Post
Playhouse adapter.

```sh
tsx scripts/historical-images/index.ts discover --config path/to/config.ts
tsx scripts/historical-images/index.ts generate --config path/to/config.ts \
  --output .artifact-output
tsx scripts/historical-images/index.ts publish --config path/to/config.ts \
  --output .artifact-output
tsx scripts/historical-images/index.ts restore --config path/to/config.ts
tsx scripts/historical-images/index.ts verify --config path/to/config.ts
```

`discover` hashes and inventories configured files. `generate` transforms only
new or changed source/profile identities and emits final assets, a versioned
manifest, and generated metadata. Pass `--previous manifest.v1.json` for an
incremental run. Deletions fail unless explicitly acknowledged with
`--allow-deleted`.

`publish` verifies local assets, writes content-addressed objects, writes the
immutable manifest, and updates the mutable pointer last. Existing immutable
names must contain identical bytes. `restore` ignores that pointer and uses the
repository lock to fetch only missing objects. Every manifest and object is
checked by digest, length, schema, source inventory, transform identity, and
image metadata before installation. A verified local cache supports offline
warm restores; unavailable cold storage fails closed.

The generic store contract is implemented by the filesystem mock and B2
transport. B2 names are constrained to the configured prefix. B2 remains a
build-time store, never a browser or production-serving origin.
