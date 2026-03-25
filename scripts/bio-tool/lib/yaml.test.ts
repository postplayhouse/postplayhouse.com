import { describe, it, expect } from "vitest"
import { extractPositionBlock, replacePositionBlock } from "./yaml"

const sampleYaml = `# start __3__
- last_name: Denton
  first_name: Don
  bio: |
    Some bio text
# end __3__
# start __2__
- last_name: Smith
  first_name: Jane
  bio: |
    Another bio
# end __2__`

describe("extractPositionBlock", () => {
  it("extracts content between position markers", () => {
    const result = extractPositionBlock(sampleYaml, 3)
    expect(result).toContain("last_name: Denton")
    expect(result).not.toContain("last_name: Smith")
  })

  it("returns null for missing position", () => {
    expect(extractPositionBlock(sampleYaml, 99)).toBeNull()
  })
})

describe("replacePositionBlock", () => {
  it("replaces content between markers", () => {
    const newBio = `- last_name: Updated
  first_name: Don
  bio: |
    New bio`
    const result = replacePositionBlock(sampleYaml, 3, newBio)
    expect(result).toContain("last_name: Updated")
    expect(result).toContain("last_name: Smith")
    expect(result).not.toContain("last_name: Denton")
  })
})
