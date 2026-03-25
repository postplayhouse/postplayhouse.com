import { execSync } from "child_process"

export interface ClaudeBioResult {
  /** Bio with italics fixes, or null if no changes needed */
  italicsBio: string | null
  /** Program bio with italics fixes, or null if no changes or not provided */
  italicsProgramBio: string | null
  /** Bio with capitalization fixes applied on top of italics, or null if no changes needed */
  capsBio: string | null
  /** Program bio with capitalization fixes, or null if no changes or not provided */
  capsProgramBio: string | null
  /** Content flag results */
  contentFlag: {
    flagged: boolean
    cleanedBio?: string
    cleanedProgramBio?: string
    reasoning?: string
  }
}

export function processBioWithClaude(
  bioText: string,
  programBioText: string | null,
  currentSeasonShows: string[],
): ClaudeBioResult {
  const showsList = currentSeasonShows.join(", ")

  const prompt = `You are processing a theatre performer's bio for Post Playhouse, a summer musical theatre company in Nebraska. They produce children's theatre and serve a conservative audience.

CURRENT SEASON SHOWS: ${showsList}

BIO TEXT:
${bioText}
${programBioText ? `\nLONGER BIO TEXT:\n${programBioText}` : ""}

Do THREE things and respond in EXACTLY this JSON format (no other text):

{
  "italics": {
    "bio": "the bio text with ONLY italics fixes applied, or null if no changes needed",
    "programBio": "the longer bio text with ONLY italics fixes applied, or null if no changes needed or no longer bio provided"
  },
  "capitalization": {
    "bio": "the bio text (after italics fixes) with ONLY capitalization fixes applied, or null if no capitalization changes needed",
    "programBio": "the longer bio text (after italics fixes) with ONLY capitalization fixes applied, or null if no changes needed or no longer bio provided"
  },
  "contentFlag": {
    "flagged": true/false,
    "cleanedBio": "bio with offensive content removed (only if flagged)",
    "cleanedProgramBio": "longer bio with offensive content removed (only if flagged and longer bio exists)",
    "reasoning": "explanation of what was flagged and why (only if flagged)"
  }
}

IMPORTANT: Each task builds on the previous one's output. Apply italics first, then capitalization fixes on top of that, then content flagging on top of that.

TASK 1 — ITALICS: Find show/musical/play titles that should be italicized with *Title* markdown syntax. Use your knowledge of the current season shows listed above AND your general knowledge of Broadway, Off-Broadway, regional theatre, film, and TV titles. Also use context clues (e.g., "appeared in X", "starred in X", "roles include X"). Do NOT italicize generic words, venue names, or company names. Only wrap actual show/production titles. If a title is already italicized with * or _, leave it as-is.

TASK 2 — CAPITALIZATION: Fix any ALL CAPS text that is not an acronym or abbreviation. People sometimes write show titles, names, or phrases in ALL CAPS. Convert these to proper Title Case for show titles or normal sentence case for other text. Common abbreviations (BFA, MFA, NYC, FSU, etc.) should remain uppercase. Apply these fixes on top of the italics output from Task 1.

TASK 3 — CONTENT FLAG: Flag anything potentially inappropriate for a conservative, family-friendly audience including children. This includes sexually explicit content, strong profanity, graphic violence, or show titles that might be alarming in a children's theatre program (e.g., aggressively titled shows). Be judicious — most theatre content is fine. Only flag genuinely concerning items. If flagged, provide a cleaned version with the concerning content removed or softened. Apply on top of the output from Tasks 1 and 2.

Respond with ONLY the JSON object, no markdown code fences.`

  // Strip CLAUDECODE env var to allow nested invocation
  const env = { ...process.env }
  delete env.CLAUDECODE

  const result = execSync(
    `echo ${JSON.stringify(prompt)} | claude --print`,
    {
      encoding: "utf-8",
      maxBuffer: 1024 * 1024,
      timeout: 120000,
      env,
    },
  )

  // Try to extract JSON from the response (Claude might wrap it in code fences despite instructions)
  let jsonStr = result.trim()
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim()
  }

  try {
    const parsed = JSON.parse(jsonStr)
    return {
      italicsBio: parsed.italics?.bio ?? null,
      italicsProgramBio: parsed.italics?.programBio ?? null,
      capsBio: parsed.capitalization?.bio ?? null,
      capsProgramBio: parsed.capitalization?.programBio ?? null,
      contentFlag: {
        flagged: parsed.contentFlag?.flagged ?? false,
        cleanedBio: parsed.contentFlag?.cleanedBio,
        cleanedProgramBio: parsed.contentFlag?.cleanedProgramBio,
        reasoning: parsed.contentFlag?.reasoning,
      },
    }
  } catch (err) {
    console.error("Failed to parse Claude response:", result.slice(0, 500))
    throw new Error("Claude returned invalid JSON")
  }
}
