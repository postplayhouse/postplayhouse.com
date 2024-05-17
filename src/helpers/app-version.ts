import { browser } from "$app/environment"
import { captureException } from "@sentry/sveltekit"

const MAX_DAILY_REFRESHES = 5

const VERSION_KEY = "post_app_version"
const noVersion = `LOCAL_VERSION ${Date.now().toString()}`

function getTodayString() {
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
}

async function getRemoteVersion() {
	try {
		const resp = await window.fetch("/_app/version.json?t=" + Date.now())
		const data = await resp.json()
		return data.version as string
	} catch {
		captureException(new Error("Failed to fetch deployment version"))
		return noVersion
	}
}

function getLocalVersion() {
	try {
		return window.sessionStorage.getItem(VERSION_KEY) || "0"
	} catch {
		return noVersion
	}
}

function setLocalVersion(version: string) {
	try {
		window.sessionStorage.setItem(VERSION_KEY, version)
	} catch {
		// no-op
	}
}

async function remoteVersionIsGreaterThanLocal() {
	const remote = await getRemoteVersion()
	const local = getLocalVersion()

	return Number(remote) > Number(local)
}

export async function initLocalAppVersion() {
	if (!browser) return

	setLocalVersion(await getRemoteVersion())
}

export async function refreshIfAppVersionOutdated() {
	if (!browser) return

	let refreshes = 0
	const timesKey = "post_app_refreshes_" + getTodayString()

	try {
		refreshes = Number(window.sessionStorage.getItem(timesKey) || "0")
	} catch {
		// If we cannot write to storage, we'll be refreshing every time. Let's bail
		// and save on bandwidth.
		return
	}

	if (refreshes >= MAX_DAILY_REFRESHES) return

	if (await remoteVersionIsGreaterThanLocal()) {
		refreshes = refreshes + 1

		try {
			window.sessionStorage.setItem(timesKey, String(refreshes))
		} catch {
			// At this point, failure to set the item is not a limitation of the
			// browser, since we've attempted other gets and sets already. So treat
			// this like a one-off and ignore the failure.
		}

		if (refreshes > MAX_DAILY_REFRESHES) return

		window.location.reload()
	}
}
