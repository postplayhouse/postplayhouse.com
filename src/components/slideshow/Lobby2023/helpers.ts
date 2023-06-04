import { browser } from "$app/environment"
export const fast = browser && document.location.search.includes("fast=1")

import { writable } from "svelte/store"

export function positiveIntStore(initialValue = 1, localStorageName?: string) {
  const { subscribe, set, update } = writable(initialValue)

  if (localStorageName) {
    let found: number | undefined

    try {
      const val = localStorage.getItem(localStorageName)
      found = val ? Number.parseInt(val) : undefined
    } catch {
      // noop
    }

    if (found) set(found)
  }

  const onUpdate = localStorageName
    ? (newVal: number) => {
        try {
          localStorage.setItem(localStorageName, newVal.toString())
        } catch {
          // noop
        }
        return newVal
      }
    : (newVal: number) => {
        return newVal
      }

  return {
    subscribe,
    increment: () => update((n) => onUpdate(n + 1)),
    decrement: () => update((n) => onUpdate(n - 1 || 1)),
  }
}
