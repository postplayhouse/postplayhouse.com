import { parseArgs } from "node:util"

type Command =
	| "discover"
	| "doctor"
	| "generate"
	| "hydrate-generation"
	| "plan"
	| "prepare"
	| "publish"
	| "restore"
	| "stage"
	| "verify"

export interface CliArguments {
	command: Command
	config?: string
	output?: string
	previous?: string
	allowDeleted: boolean
	json: boolean
}

const usage = `Usage: historical-images <command> [options]

Commands:
  discover                 Report the configured source inventory
  restore                  Verify and install reviewed assets into static
  hydrate-generation       Hydrate the trusted publisher workspace
  plan                     Report generation work without mutating files
  stage                    Hydrate, plan, and generate trusted output
  publish                  Publish staged output (trusted publisher only)
  doctor                   Run offline, non-mutating diagnostics

Compatibility aliases: prepare (hydrate-generation), verify (restore)
Low-level generate remains available for existing automation.
Global option: --config <path>
Run historical-images <command> --help for command options.`

const commandOptions: Record<
	Command,
	Record<string, { type: "boolean" | "string" }>
> = {
	discover: {},
	doctor: { json: { type: "boolean" } },
	generate: {
		output: { type: "string" },
		previous: { type: "string" },
		"allow-deleted": { type: "boolean" },
	},
	"hydrate-generation": { output: { type: "string" } },
	plan: { previous: { type: "string" } },
	prepare: { output: { type: "string" } },
	publish: { output: { type: "string" } },
	restore: {},
	stage: {
		output: { type: "string" },
		"allow-deleted": { type: "boolean" },
	},
	verify: {},
}

function commandHelp(command: Command): string {
	const options = Object.entries(commandOptions[command])
		.map(
			([name, option]) =>
				`  --${name}${option.type === "string" ? " <value>" : ""}`,
		)
		.join("\n")
	return `Usage: historical-images ${command}${options ? " [options]" : ""}\n${options}`.trimEnd()
}

export function parseCli(argv: string[]): CliArguments | { help: string } {
	if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h")
		return { help: usage }
	const command = argv[0] as Command
	if (!(command in commandOptions))
		throw new Error(`Unknown command: ${argv[0]}\n\n${usage}`)
	if (argv.includes("--help") || argv.includes("-h")) {
		if (argv.length !== 2)
			throw new Error("--help cannot be combined with other options")
		return { help: commandHelp(command) }
	}
	const { values } = parseArgs({
		args: argv.slice(1),
		allowPositionals: false,
		strict: true,
		options: {
			config: { type: "string" },
			...commandOptions[command],
		},
	})
	const options = values as Record<string, string | boolean | undefined>
	return {
		command,
		config: options.config as string | undefined,
		output: options.output as string | undefined,
		previous: options.previous as string | undefined,
		allowDeleted: (options["allow-deleted"] as boolean | undefined) ?? false,
		json: (options.json as boolean | undefined) ?? false,
	}
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
	const parsed = parseCli(argv)
	if ("help" in parsed) {
		console.log(parsed.help)
		return
	}
	const { run } = await import("./commands")
	await run(parsed)
}

if (import.meta.url === new URL(process.argv[1] ?? "", "file:").href) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : error)
		process.exitCode = 1
	})
}
