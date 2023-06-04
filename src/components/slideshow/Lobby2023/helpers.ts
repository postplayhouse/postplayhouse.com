import { browser } from "$app/environment"
export const fast = browser && document.location.search.includes("fast=1")

import { writable } from "svelte/store"

export function positiveIntStore(initialValue = 1) {
  const { subscribe, set, update } = writable(initialValue)

  return {
    subscribe,
    increment: () => update((n) => n + 1),
    decrement: () => update((n) => n - 1 || 1),
  }
}
