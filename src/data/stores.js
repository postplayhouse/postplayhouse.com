import { writable } from "svelte/store"

function createShowDonateModal() {
  const { subscribe, set, update } = writable(false)

  return {
    subscribe,
    toggle: () => update((n) => !n),
    hide: () => set(false),
    show: () => set(true),
  }
}

export const showDonateModal = createShowDonateModal()
