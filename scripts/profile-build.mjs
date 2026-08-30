import { spawn, execFileSync } from "node:child_process"
import { writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

const SAMPLE_INTERVAL_MS = 250
const DEFAULT_THRESHOLDS = [3, 3.4, 3.6].map(
	(gibibytes) => gibibytes * 1024 ** 3,
)

export function summarizeSamples(samples, thresholds = DEFAULT_THRESHOLDS) {
	const peakRssBytes = Math.max(0, ...samples.map((sample) => sample.rssBytes))
	const durationAbove = (threshold) =>
		samples.reduce((duration, sample, index) => {
			if (sample.rssBytes < threshold || index === samples.length - 1)
				return duration
			return duration + samples[index + 1].elapsedMs - sample.elapsedMs
		}, 0)

	return {
		peakRssBytes,
		millisecondsAtOrAbove: Object.fromEntries(
			thresholds.map((threshold) => [
				String(threshold),
				durationAbove(threshold),
			]),
		),
		millisecondsAtOrAbove90PercentOfPeak: durationAbove(peakRssBytes * 0.9),
	}
}

function processTreeRss(rootPid) {
	const rows = execFileSync("ps", ["-axo", "pid=,ppid=,rss="], {
		encoding: "utf8",
	})
		.trim()
		.split("\n")
		.map((line) => line.trim().split(/\s+/).map(Number))
	const descendants = new Set([rootPid])
	let changed = true
	while (changed) {
		changed = false
		for (const [pid, parentPid] of rows) {
			if (descendants.has(parentPid) && !descendants.has(pid)) {
				descendants.add(pid)
				changed = true
			}
		}
	}
	return rows.reduce(
		(total, [pid, , rssKiB]) =>
			total + (descendants.has(pid) ? rssKiB * 1024 : 0),
		0,
	)
}

function parseArguments(args) {
	const separator = args.indexOf("--")
	if (separator < 0) throw new Error("command must follow --")
	const options = args.slice(0, separator)
	const command = args.slice(separator)
	const value = (name) => {
		const index = options.indexOf(name)
		return index < 0 ? undefined : options[index + 1]
	}
	return {
		output: value("--output"),
		csv: value("--csv"),
		command: command.slice(1),
	}
}

async function main() {
	const { output, csv, command } = parseArguments(process.argv.slice(2))
	if (!output || !csv || command.length === 0) {
		throw new Error(
			"usage: profile-build.mjs --output report.json --csv curve.csv -- <command>",
		)
	}

	const startedAt = Date.now()
	const child = spawn(command[0], command.slice(1), {
		stdio: "inherit",
		env: process.env,
	})
	const samples = []
	const sample = () => {
		try {
			samples.push({
				elapsedMs: Date.now() - startedAt,
				rssBytes: processTreeRss(child.pid),
			})
		} catch {
			// The process can exit between the timer firing and ps reading it.
		}
	}
	sample()
	const timer = setInterval(sample, SAMPLE_INTERVAL_MS)
	const exitCode = await new Promise((resolve, reject) => {
		child.on("error", reject)
		child.on("close", (code, signal) => resolve(code ?? (signal ? 1 : 0)))
	})
	clearInterval(timer)
	sample()

	const wallClockMs = Date.now() - startedAt
	const report = {
		command,
		exitCode,
		wallClockMs,
		sampleIntervalMs: SAMPLE_INTERVAL_MS,
		...summarizeSamples(samples),
	}
	await writeFile(output, `${JSON.stringify(report, null, 2)}\n`)
	await writeFile(
		csv,
		`elapsed_ms,rss_bytes\n${samples
			.map((sample) => `${sample.elapsedMs},${sample.rssBytes}`)
			.join("\n")}\n`,
	)
	console.log(JSON.stringify(report, null, 2))
	process.exitCode = exitCode
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main().catch((error) => {
		console.error(error)
		process.exitCode = 1
	})
}
