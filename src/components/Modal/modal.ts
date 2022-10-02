import { browser } from "$app/environment"
import { onMount } from "svelte"

export type LifecycleRef<T> = { current: T | null }

/**
 * Mounts a bound element in a portal. Be sure to bind your ref.current to an
 * element that is guaranteed to be present when the component is first mounted,
 * or there will be trouble.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   let ref = LifecycleRef<HTMLDivElement> = {current: null}
 *   lifecycle(ref)
 * </script>
 *
 * <!-- the parent is hidden, but the child with the `ref` will be appended
 * elsewhere in the DOM via `onMount` -->
 * <div class="hidden">
 *   <div bind:this="{ref.current}">Hello world</div>
 * </div>
 * ```
 */
export function mountInPortal(
  ref: LifecycleRef<HTMLElement>,
  portalClassName: string,
) {
  if (browser)
    onMount(function createPortal() {
      const portal = document.createElement("div")

      portal.className = portalClassName
      document.body.appendChild(portal)
      portal.appendChild(ref.current as HTMLElement)

      return () => {
        try {
          document.body.removeChild(portal)
        } catch {
          //
        }
      }
    })
}
