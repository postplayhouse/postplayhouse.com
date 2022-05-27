import { browser } from "$app/env"

const MAX_DAILY_REFRESHES = 5

const VERSION_KEY = "post_app_version"
const noVersion = Date.now().toString()

function getTodayString() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
}

async function getRemoteVersion() {
  if (!browser) return noVersion

  try {
    const resp = await window.fetch("/_app/version.json?t=" + Date.now())
    const data = await resp.json()
    return data.version as string
  } catch {
    return noVersion
  }
}

function getLocalVersion() {
  if (!browser) return noVersion

  try {
    return window.sessionStorage.getItem(VERSION_KEY)
  } catch {
    return noVersion
  }
}

function setLocalVersion(version: string) {
  if (!browser) return

  try {
    window.sessionStorage.setItem(VERSION_KEY, version)
  } catch {
    // no-op
  }
}

async function remoteVersionIsGreaterThanLocal() {
  if (!browser) return false

  const remote = await getRemoteVersion()
  const local = getLocalVersion()

  return Number(remote) > Number(local)
}

export async function initLocalAppVersion() {
  if (!browser) return

  const remote = await getRemoteVersion()
  setLocalVersion(remote)
}

export async function refreshIfAppVersionOutdated() {
  if (!browser) return

  let refreshes = 0
  const timesKey = "post_app_refreshes_" + getTodayString()
  try {
    refreshes = Number(window.sessionStorage.getItem(timesKey) || "0")
  } catch {
    refreshes = MAX_DAILY_REFRESHES
  }

  if (refreshes >= MAX_DAILY_REFRESHES) return

  if (await remoteVersionIsGreaterThanLocal()) {
    refreshes = refreshes + 1
    try {
      window.sessionStorage.setItem(timesKey, String(refreshes))
    } catch {
      refreshes = MAX_DAILY_REFRESHES
    }

    if (refreshes > MAX_DAILY_REFRESHES) return

    window.location.reload()
  }
}
