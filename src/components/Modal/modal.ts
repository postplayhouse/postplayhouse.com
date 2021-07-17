import { browser } from "$app/env"
import { onMount } from "svelte"

export function lifecycle(ref: { current: HTMLElement }, name: string) {
  if (browser)
    onMount(function createPortal() {
      const portal = document.createElement("div")

      portal.className = name
      document.body.appendChild(portal)
      portal.appendChild(ref.current)

      return () => {
        try {
          document.body.removeChild(portal)
        } catch {}
      }
    })
}
