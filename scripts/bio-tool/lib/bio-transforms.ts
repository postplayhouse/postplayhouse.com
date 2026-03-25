/**
 * Bio text transforms for mechanical pre-processing of bios.
 * These run before the Claude AI pass and handle predictable patterns.
 */

/**
 * Convert Instagram handles in various formats to markdown links.
 * Handles: @handle, "Instagram: handle", "IG: @handle"
 * Returns modified text or null if no changes were made.
 */
export function linkInstagramHandles(text: string): string | null {
  let result = text

  // "Instagram: handle" or "Instagram: @handle"
  result = result.replace(
    /\b(Instagram:\s*)@?(\w[\w.]+)/gi,
    (_, prefix, handle) => `${prefix}[@${handle}](https://www.instagram.com/${handle})`,
  )

  // "IG: handle" or "IG: @handle"
  result = result.replace(
    /\b(IG:\s*)@?(\w[\w.]+)/gi,
    (_, prefix, handle) => `${prefix}[@${handle}](https://www.instagram.com/${handle})`,
  )

  // Standalone @handle — but not if already inside a markdown link like [@handle](...)
  result = result.replace(
    /(?<!\[)@(\w[\w.]+)(?!\])/g,
    (match, handle) => `[@${handle}](https://www.instagram.com/${handle})`,
  )

  return result === text ? null : result
}

/**
 * Convert bare URLs to markdown links.
 * Handles www.example.com and http(s)://... URLs not already in markdown links.
 * Returns modified text or null if no changes were made.
 */
export function linkBareUrls(text: string): string | null {
  let result = text

  // Match bare www. URLs not already inside a markdown link
  // Negative lookbehinds: not after "(", "://", ":", or "["
  result = result.replace(
    /(?<!\()(?<!\/)(?<!\:)(?<!\[)(www\.\S+?)(?=[)\]\s,;!?]*(?:\s|$))/g,
    (match) => `[${match}](https://${match})`,
  )

  // Match http:// or https:// URLs not already inside markdown link syntax ](url) or (url)
  result = result.replace(
    /(?<!\]\()(?<!\()(https?:\/\/\S+?)(?=[)\]\s,;!?]*(?:\s|$))/g,
    (match) => {
      const display = match.replace(/^https?:\/\//, "").replace(/\/$/, "")
      return `[${display}](${match})`
    },
  )

  return result === text ? null : result
}

interface UrlCheckResult {
  url: string
  reachable: boolean
  status?: number
  redirectedTo?: string
}

/**
 * Verify a URL is reachable via HEAD request with 5s timeout.
 * Non-throwing — always returns a result object.
 */
export async function verifyUrl(url: string): Promise<UrlCheckResult> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    })

    clearTimeout(timeout)

    const redirectedTo =
      response.url && response.url !== url ? response.url : undefined

    return {
      url,
      reachable: response.ok,
      status: response.status,
      redirectedTo,
    }
  } catch {
    return { url, reachable: false }
  }
}

/**
 * Extract URLs from markdown link syntax `](https://...)`.
 */
export function extractUrls(text: string): string[] {
  const matches = text.matchAll(/\]\((https?:\/\/[^)]+)\)/g)
  return [...matches].map((m) => m[1])
}

/**
 * Extract all URLs from text — both markdown links and bare URLs.
 * Deduplicates results.
 */
export function extractAllUrls(text: string): string[] {
  const urls = new Set<string>()

  // Markdown links — extract the href from ](url)
  for (const m of text.matchAll(/\]\((https?:\/\/[^)]+)\)/g)) {
    urls.add(m[1])
  }

  // Bare URLs not already inside markdown link text ( i.e. not preceded by `[` ).
  // Stop at whitespace, ], or ) so we don't eat markdown link syntax.
  // Handles both https?:// and www. forms.
  for (const m of text.matchAll(/(?<!\[)(https?:\/\/[^\s)\]]+|www\.[^\s)\]]+)/g)) {
    let url = m[1].replace(/[,;!?.]+$/, "")
    if (url.startsWith("www.")) url = `https://${url}`
    urls.add(url)
  }

  return [...urls]
}
