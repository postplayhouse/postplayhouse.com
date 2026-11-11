import { chromium, webkit, devices } from "@playwright/test"
import { writeFile, mkdir, readdir, readFile } from "node:fs/promises"
import { execFileSync } from "node:child_process"
import { join } from "node:path"

// Compare a settled, visible page rather than startup or server/build CPU.
// Example: node scripts/profile-animation.mjs --output /tmp/cpu.json main=http://localhost:3001 anniversary=http://localhost:3000
const args = process.argv.slice(2)
const option = (name, fallback) => {
	const index = args.indexOf(name)
	if (index < 0) return fallback
	return args.splice(index, 2)[1]
}
const output = option("--output", "/tmp/animation-cpu.json")
const seconds = Number(option("--seconds", "10"))
const runs = Number(option("--runs", "3"))
const pause = option("--pause", "")
const traceDirectory = option("--trace-dir", "")
const executablePath = option("--chrome", process.env.CHROME_PATH)
const engine = option("--engine", "chromium")
if (!["chromium", "webkit"].includes(engine)) throw new Error("Unknown engine")
if (traceDirectory && engine !== "chromium")
	throw new Error("Tracing requires Chromium")
const cases = args.map((arg) => {
	const separator = arg.indexOf("=")
	if (separator < 1) throw new Error("Pass cases as name=http://host:port/")
	return { name: arg.slice(0, separator), url: arg.slice(separator + 1) }
})
if (!cases.length) throw new Error("At least one named URL is required")

const median = (values) => {
	const sorted = [...values].sort((a, b) => a - b)
	const middle = Math.floor(sorted.length / 2)
	return sorted.length % 2
		? sorted[middle]
		: (sorted[middle - 1] + sorted[middle]) / 2
}

// WebKit has no SystemInfo CDP endpoint. Count its complete Linux process tree
// using the same OS CPU counters (including rendering and network subprocesses).
async function webkitProcesses(rootPid) {
	const ticksPerSecond = Number(
		execFileSync("getconf", ["CLK_TCK"], { encoding: "utf8" }),
	)
	const processes = (
		await Promise.all(
			(await readdir("/proc"))
				.filter((pid) => /^\d+$/.test(pid))
				.map(async (pid) => {
					try {
						const stat = await readFile(`/proc/${pid}/stat`, "utf8")
						const end = stat.lastIndexOf(")")
						const fields = stat.slice(end + 2).split(" ")
						return {
							id: Number(pid),
							parent: Number(fields[1]),
							type: stat.slice(stat.indexOf("(") + 1, end),
							cpuTime:
								(Number(fields[11]) + Number(fields[12])) / ticksPerSecond,
						}
					} catch (error) {
						if (error.code !== "ENOENT" && error.code !== "ESRCH") throw error
					}
				}),
		)
	).filter(Boolean)
	const descendants = new Set([rootPid])
	for (let previousSize = 0; previousSize !== descendants.size; ) {
		previousSize = descendants.size
		for (const p of processes)
			if (descendants.has(p.parent)) descendants.add(p.id)
	}
	return processes.filter((p) => descendants.has(p.id))
}

async function sample({ name, url }, run) {
	const server = engine === "webkit" ? await webkit.launchServer() : null
	const browser = server
		? await webkit.connect(server.wsEndpoint())
		: await chromium.launch({ executablePath })
	try {
		const context = await browser.newContext({
			...devices["iPhone 14"],
			colorScheme: "dark",
			reducedMotion: "no-preference",
		})
		const page = await context.newPage()
		const pageErrors = []
		page.on("pageerror", (error) => pageErrors.push(error.message))
		const response = await page.goto(url, { waitUntil: "networkidle" })
		if (!response?.ok()) throw new Error(`${url}: HTTP ${response?.status()}`)
		await page.evaluate(() => document.fonts.ready)
		if (pause) {
			await page.addStyleTag({
				content: `${pause} { animation-play-state: paused !important; }`,
			})
		}
		await page.waitForTimeout(3000)
		if (pageErrors.length) throw new Error(pageErrors.join("\n"))
		const burst = page.locator("[data-anniversary-burst]")
		if (await burst.count()) {
			await page.waitForFunction(
				() =>
					document
						.querySelector("[data-anniversary-burst]")
						?.getAttribute("data-motion") === "running",
			)
		}
		const animationCount = () =>
			page.evaluate(
				() =>
					document.getAnimations().filter((a) => a.playState === "running")
						.length,
			)
		const animationsBefore = await animationCount()
		const browserSession = server ? null : await browser.newBrowserCDPSession()
		const pageSession = server ? null : await context.newCDPSession(page)
		await pageSession?.send("Performance.enable")
		const processInfo = () =>
			server
				? webkitProcesses(server.process().pid)
				: browserSession
						.send("SystemInfo.getProcessInfo")
						.then((r) => r.processInfo)
		const metrics = async () =>
			pageSession
				? (await pageSession.send("Performance.getMetrics")).metrics
				: []
		const events = []
		if (traceDirectory) {
			pageSession.on("Tracing.dataCollected", ({ value }) =>
				events.push(...value),
			)
			await pageSession.send("Tracing.start", {
				categories: "devtools.timeline,blink,cc,gpu",
				transferMode: "ReportEvents",
			})
		}
		const beforeProcesses = await processInfo()
		const beforeMetrics = await metrics()
		const started = performance.now()
		await page.waitForTimeout(seconds * 1000)
		const elapsedSeconds = (performance.now() - started) / 1000
		const afterProcesses = await processInfo()
		const afterMetrics = await metrics()
		const animations = await animationCount()
		if (animations !== animationsBefore || pageErrors.length)
			throw new Error("Page or animation state changed during measurement")
		const cpuSecondsByProcessType = {}
		for (const process of afterProcesses) {
			const previous = beforeProcesses.find((p) => p.id === process.id)
			const delta = process.cpuTime - (previous?.cpuTime ?? 0)
			cpuSecondsByProcessType[process.type] =
				(cpuSecondsByProcessType[process.type] ?? 0) + delta
		}
		const metricDeltas = {}
		for (const { name, value } of afterMetrics) {
			if (/Duration$|Count$/.test(name))
				metricDeltas[name] =
					value - (beforeMetrics.find((m) => m.name === name)?.value ?? 0)
		}
		if (traceDirectory) {
			const completed = new Promise((resolve) =>
				pageSession.once("Tracing.tracingComplete", resolve),
			)
			await pageSession.send("Tracing.end")
			await completed
			await mkdir(traceDirectory, { recursive: true })
			await writeFile(
				join(traceDirectory, `${name}-${run}.json`),
				JSON.stringify({ traceEvents: events }),
			)
		}
		const cpuSeconds = Object.values(cpuSecondsByProcessType).reduce(
			(a, b) => a + b,
			0,
		)
		return {
			name,
			engine,
			url,
			run,
			elapsedSeconds,
			cpuPercentOfOneCore: (cpuSeconds / elapsedSeconds) * 100,
			cpuSecondsByProcessType,
			metricDeltas,
			animations,
		}
	} finally {
		await browser.close()
		await server?.close()
	}
}

const samples = []
for (let run = 1; run <= runs; run++) {
	// Alternate order between rounds to reduce drift from host contention.
	for (const entry of run % 2 ? cases : [...cases].reverse()) {
		const result = await sample(entry, run)
		samples.push(result)
		console.log(JSON.stringify(result))
		await writeFile(
			output,
			JSON.stringify(
				{ seconds, runs, pause, traceDirectory, samples },
				null,
				2,
			) + "\n",
		)
	}
}
const summary = cases.map(({ name }) => ({
	name,
	medianCpuPercentOfOneCore: median(
		samples.filter((s) => s.name === name).map((s) => s.cpuPercentOfOneCore),
	),
}))
await writeFile(
	output,
	JSON.stringify(
		{ seconds, runs, pause, traceDirectory, samples, summary },
		null,
		2,
	) + "\n",
)
console.log(JSON.stringify(summary, null, 2))
