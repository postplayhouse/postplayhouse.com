import { browser } from "$app/environment"
export const fast = browser && document.location.search.includes("fast=1")
