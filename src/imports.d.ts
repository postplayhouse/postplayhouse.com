import type { SvelteComponent } from "svelte"

declare module "*.md" {
  const Component: SvelteComponent
  export default Component
}
