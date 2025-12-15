import { prerender } from "$app/server"
import { getEnhancedImages } from "./lib"

export const getMediaImages = prerender(getEnhancedImages)
