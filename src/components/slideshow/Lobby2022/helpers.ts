import { browser } from "$app/env"
export const fast = browser && document.location.search.includes("fast=1")
