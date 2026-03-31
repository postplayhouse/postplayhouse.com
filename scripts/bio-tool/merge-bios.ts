import { execSync } from "child_process"
import { writeFileSync, unlinkSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { checkbox } from "@inquirer/prompts"
import { load as yamlLoad } from "js-yaml"
import {
	git,
	ensureCleanWorkingDir,
	isPositionAlreadyMerged,
	fetchRemoteBioUpdateBranches,
	listBioUpdateBranches,
	checkoutMaster,
	checkoutBranch,
	commitWithMessageFile,
	currentBranch,
} from "./lib/git"
import { getCurrentSeason, seasonYamlPath } from "./lib/season"
import { readSeasonYaml, extractPositionBlock } from "./lib/yaml"
import { saveEmail, getEmail } from "./lib/manifest"
import { checkAllLinks } from "./check-links"

interface PersonData {
	first_name: string
	last_name: string
	[key: string]: unknown
}

function getPersonName(branch: string, position: number): string {
	try {
		const yaml = git(`show ${branch}:src/data/people/${getCurrentSeason()}.yml`)
		const block = extractPositionBlock(yaml.replace(/\r\n/g, "\n"), position)
		if (!block) return `Position ${position}`
		const parsed = yamlLoad(block) as PersonData[]
		if (parsed?.[0]) {
			return `${parsed[0].first_name} ${parsed[0].last_name}`
		}
	} catch {
		// fall through
	}
	return `Position ${position}`
}

function getCommitsAheadOfMaster(
	branch: string,
): { hash: string; message: string }[] {
	try {
		const log = git(`log master..${branch} --format="%H||%s" --reverse`)
		if (!log) return []
		return log.split("\n").map((line) => {
			const [hash, ...rest] = line.split("||")
			return { hash, message: rest.join("||") }
		})
	} catch {
		return []
	}
}

const skipMissingEmails = process.argv.includes("--skip-missing-emails")

async function main() {
	ensureCleanWorkingDir()
	const startBranch = currentBranch()
	const season = getCurrentSeason()

	console.log("Fetching remote bio-update branches...")
	const yamlPath = seasonYamlPath(season)
	fetchRemoteBioUpdateBranches(yamlPath)
	const cutoffYear = season - 1
	const cutoff = new Date(cutoffYear, 8, 1) // September 1st of prior year
	const allBranches = listBioUpdateBranches().filter((b: { date: Date }) => b.date >= cutoff)

	// Filter out branches whose position is already newer on master
	const branches = allBranches.filter(({ branch, position }: { branch: string; position: number }) => {
		return !isPositionAlreadyMerged(yamlPath, position, branch)
	})

	if (!branches.length) {
		console.log("No current-season bio-update branches found.")
		return
	}

	// Check that all branches have emails in the manifest
	const missingEmails: { position: number; name: string }[] = []
	for (const b of branches) {
		const name = getPersonName(b.branch, b.position)
		if (!getEmail(b.position)) {
			missingEmails.push({ position: b.position, name })
		}
	}

	if (missingEmails.length && !skipMissingEmails) {
		console.log(`\nMissing emails for ${missingEmails.length} branch(es):`)
		for (const { position, name } of missingEmails) {
			console.log(`  Position ${position}: ${name}`)
		}
		console.log("\nRun 'pnpm bio:emails' first to collect emails.")
		console.log("Or use --skip-missing-emails to proceed without them.")
		process.exit(1)
	}

	// Build choices with person names
	const branchChoices = branches.map((b) => {
		const name = getPersonName(b.branch, b.position)
		const commits = getCommitsAheadOfMaster(b.branch)
		return {
			name: `${name} (${b.branch}, ${commits.length} commit${commits.length === 1 ? "" : "s"})`,
			value: b,
		}
	})

	const selectedBranches = await checkbox({
		message: "Select branches to squash-merge onto master:",
		choices: branchChoices,
	})

	if (!selectedBranches.length) {
		console.log("Nothing selected.")
		return
	}

	checkoutMaster()

	const mergedPeople: { position: number; name: string }[] = []
	const mergeErrors: { name: string; error: string }[] = []

	for (const { branch, position } of selectedBranches as { branch: string; position: number }[]) {
		const name = getPersonName(branch, position)

		// Try to extract email from PR description and save to manifest
		tryExtractEmailFromPr(branch, position, name)
		const commits = getCommitsAheadOfMaster(branch)

		if (!commits.length) {
			console.log(`\n${name}: no commits ahead of master, skipping`)
			continue
		}

		console.log(`\n--- ${name} (${branch}) ---`)

		const adjustmentCommits = commits.slice(1)

		// Build the squashed commit message (normalize to canonical format)
		const title = `Bio ${position}: ${name}`
		let body = ""
		if (adjustmentCommits.length > 0) {
			body =
				"Includes:\n" + adjustmentCommits.map((c) => `- ${c.message}`).join("\n")
		}

		const tempBranch = `_bio-merge-temp-${position}`
		const deleteTempBranch = () => {
			try { git(`branch -D ${tempBranch}`) } catch { /* ignore */ }
		}

		try {
			deleteTempBranch() // clean up any leftover from a previous failed run
			git(`checkout -b ${tempBranch} master`)

			// Cherry-pick each commit (in order); break on first conflict
			let cherryPickFailed = false
			for (const commit of commits) {
				try {
					git(`cherry-pick --allow-empty ${commit.hash}`)
				} catch {
					console.error(
						`  Cherry-pick failed for "${commit.message}", aborting this branch`,
					)
					cherryPickFailed = true
					try { git("cherry-pick --abort") } catch { /* ignore */ }
					break
				}
			}

			if (cherryPickFailed) {
				mergeErrors.push({ name, error: "Cherry-pick conflict — merge manually" })
				git("checkout master")
				deleteTempBranch()
				continue
			}

			// Squash all commits on temp branch into one
			const mergeBase = git(`merge-base ${tempBranch} master`)
			git(`reset --soft ${mergeBase}`)
			commitWithMessageFile(body ? `${title}\n\n${body}` : title)

			// Fast-forward master to the squashed commit
			const squashedSha = git("rev-parse HEAD")
			git("checkout master")
			git(`merge --ff-only ${squashedSha}`)

			console.log(`  Merged: ${title}`)
			for (const c of adjustmentCommits) {
				console.log(`    + ${c.message}`)
			}
			mergedPeople.push({ position, name })
		} catch (err) {
			const msg = err instanceof Error ? err.message.split("\n")[0] : String(err)
			console.error(`  Error merging ${name}: ${msg}`)
			mergeErrors.push({ name, error: msg })
			try { git("cherry-pick --abort") } catch { /* ignore */ }
			try { git("checkout master") } catch { /* ignore */ }
		} finally {
			deleteTempBranch()
		}
	}

	// Check links on master before restoring start branch
	if (mergedPeople.length) {
		console.log("\n--- Checking links ---")
		const linksOk = await checkAllLinks()
		if (!linksOk) {
			console.log("\nBroken links detected above. Please fix them when you can.")
		}
	}

	checkoutBranch(startBranch)

	// Compose emails for merged people
	if (mergedPeople.length) {
		console.log(`\n--- Composing emails for ${mergedPeople.length} people ---`)
		const missing = composeEmails(mergedPeople)
		if (missing.length) {
			console.log(`\n--- Missing emails (could not compose) ---`)
			for (const { name, position } of missing) {
				console.log(`  Position ${position}: ${name}`)
			}
		}
	}

	if (mergeErrors.length) {
		console.log(`\n--- Failed to merge (${mergeErrors.length}) ---`)
		for (const { name, error } of mergeErrors) {
			console.log(`  ${name}: ${error}`)
		}
	}

	console.log("\nDone.")
}

function tryExtractEmailFromPr(
	branch: string,
	position: number,
	name: string,
): void {
	// Already have an email? Skip.
	if (getEmail(position)) return

	try {
		// Try to get PR body via gh CLI
		const prBody = execSync(
			`gh pr list --head "${branch}" --state all --json body --jq ".[0].body" 2>/dev/null`,
			{ encoding: "utf-8", timeout: 10000 },
		).trim()

		if (!prBody) return

		// PR body format: "Bio N for Name (localpart\n\nwho lives at the domain\n\ndomain)"
		const match = prBody.match(
			/\(([^\s]+)\s*\n\s*who lives at the domain\s*\n\s*([^\s)]+)\)/,
		)
		if (match) {
			const email = `${match[1]}@${match[2]}`
			saveEmail(position, name, email)
			console.log(`  Saved email for ${name}`)
		}
	} catch {
		// gh not available or PR not found, skip
	}
}

const EMAIL_BODY = `Thanks for submitting your bio to Post Playhouse. It is live on the website (or will be very shortly). There are two places you will (eventually) see your bio on the site:

1. https://postplayhouse.com/program-bios
This is where you should go to proof your bio. We don't share this page with the public.

2. https://postplayhouse.com/who/2026
This is where the public will see your bio. If you are an actor, your bio will not appear here until after casting is complete, or nearly complete.

Please visit the first address above and check that your bio is correct. If you don't spot any mistakes in your bio, then you needn't do anything else.

I can make alterations (if you discover a typo, etc) for a time, but If I do not hear from you soon, the bio will be printed as is for our program. If you request changes after that, I can always accommodate them on the website, though.

If you have any questions, please feel free to reach out.
`

function composeEmailWithSpark(email: string, subject: string, body: string): void {
	const escapedEmail = email.replace(/"/g, '\\"')
	const escapedSubject = subject.replace(/"/g, '\\"')

	// Write body to a temp file so pbcopy can read it — this preserves Unix
	// \n newlines. AppleScript's `set the clipboard to` uses \r (carriage
	// return), which Spark's WebKit compose body strips as whitespace.
	const tmpBody = join(tmpdir(), `spark-body-${Date.now()}.txt`)
	writeFileSync(tmpBody, body, "utf-8")

	// Use pbcopy (preserves \n) rather than AppleScript clipboard assignment
	// (\r), which Spark's WebKit body strips as whitespace.
	//
	// Activate Spark first so if it wasn't running it fully launches and its
	// main window settles before we open the compose URL. Then poll until a
	// new window appears (the compose window) before pasting — otherwise the
	// paste goes to the main window on first launch.
	const script = `do shell script "cat " & quoted form of "${tmpBody}" & " | pbcopy"

if application "Spark" is not running then
	tell application "Spark" to activate
	delay 3
else
	tell application "Spark" to activate
end if

set winCountBefore to 0
tell application "System Events"
	tell process "Spark"
		set winCountBefore to count of windows
	end tell
end tell

open location "readdle-spark://compose?recipient=${escapedEmail}&subject=${escapedSubject}"

repeat 20 times
	delay 0.5
	tell application "System Events"
		tell process "Spark"
			if (count of windows) > winCountBefore then exit repeat
		end tell
	end tell
end repeat

delay 0.3

tell application "System Events"
	tell process "Spark"
		set frontmost to true
		keystroke "v" using command down
	end tell
end tell`

	const tmpScript = join(tmpdir(), `spark-compose-${Date.now()}.applescript`)
	writeFileSync(tmpScript, script, "utf-8")
	try {
		execSync(`osascript "${tmpScript}"`)
	} finally {
		for (const f of [tmpBody, tmpScript]) {
			try { unlinkSync(f) } catch { /* ignore */ }
		}
	}
}

function composeEmails(
	people: { position: number; name: string }[],
): { position: number; name: string }[] {
	const missing: { position: number; name: string }[] = []
	for (const { position, name } of people) {
		const entry = getEmail(position)
		if (!entry) {
			missing.push({ position, name })
			continue
		}

		console.log(`  Opening compose for ${name} (${entry.email})...`)
		try {
			composeEmailWithSpark(entry.email, "Your Post Playhouse Bio", EMAIL_BODY)
		} catch {
			console.log(`    Failed to compose email for ${name}`)
		}
	}

	return missing
}

main().catch((err) => {
	if (err?.name === "ExitPromptError") {
		console.log("\nExited.")
		process.exit(0)
	}
	console.error(err)
	process.exit(1)
})
