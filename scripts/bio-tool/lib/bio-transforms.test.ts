import { describe, it, expect } from "vitest"
import { linkInstagramHandles, linkBareUrls, extractAllUrls } from "./bio-transforms"

describe("linkInstagramHandles", () => {
  it("converts @handle to instagram link", () => {
    const input = "Follow me @johndoe on social media"
    expect(linkInstagramHandles(input)).toBe(
      "Follow me [@johndoe](https://www.instagram.com/johndoe) on social media",
    )
  })

  it("converts 'Instagram: handle' format", () => {
    const input = "Instagram: johndoe"
    expect(linkInstagramHandles(input)).toBe(
      "Instagram: [@johndoe](https://www.instagram.com/johndoe)",
    )
  })

  it("converts 'IG: @handle' format", () => {
    const input = "IG: @johndoe"
    expect(linkInstagramHandles(input)).toBe(
      "IG: [@johndoe](https://www.instagram.com/johndoe)",
    )
  })

  it("skips handles already in markdown links", () => {
    const input = "Follow [@johndoe](https://www.instagram.com/johndoe)"
    expect(linkInstagramHandles(input)).toBeNull()
  })

  it("returns null if no changes", () => {
    expect(linkInstagramHandles("No handles here")).toBeNull()
  })
})

describe("linkBareUrls", () => {
  it("converts www.example.com to markdown link", () => {
    const input = "Visit www.example.com for more"
    expect(linkBareUrls(input)).toBe(
      "Visit [www.example.com](https://www.example.com) for more",
    )
  })

  it("converts http:// URLs", () => {
    const input = "See http://example.com/page"
    expect(linkBareUrls(input)).toBe(
      "See [example.com/page](http://example.com/page)",
    )
  })

  it("skips URLs already in markdown links", () => {
    const input = "[my site](https://example.com)"
    expect(linkBareUrls(input)).toBeNull()
  })

  it("skips www URLs already in markdown link display text", () => {
    const input =
      "[www.kristentheresechua.com](http://www.kristentheresechua.com)"
    expect(linkBareUrls(input)).toBeNull()
  })

  it("returns null if no changes", () => {
    expect(linkBareUrls("No URLs here")).toBeNull()
  })
})

describe("extractAllUrls", () => {
  it("extracts URLs from markdown links", () => {
    const input = "Visit [my site](https://example.com) for more"
    expect(extractAllUrls(input)).toContain("https://example.com")
  })

  it("extracts bare https URLs", () => {
    const input = "Visit https://example.com for more"
    expect(extractAllUrls(input)).toContain("https://example.com")
  })

  it("does not double-extract URLs from markdown links", () => {
    const input = "[https://example.com](https://example.com)"
    const urls = extractAllUrls(input)
    expect(urls).toEqual(["https://example.com"])
  })

  it("deduplicates repeated URLs", () => {
    const input = "https://example.com and https://example.com"
    expect(extractAllUrls(input)).toHaveLength(1)
  })

  it("does not duplicate URL when www. appears in both link text and href", () => {
    const input = "[www.julia-iaquinta.com](https://www.julia-iaquinta.com)"
    const urls = extractAllUrls(input)
    expect(urls).toEqual(["https://www.julia-iaquinta.com"])
  })

  it("does not fabricate https URL from www. display text when href is http", () => {
    const input = "[www.timothyellis.com](http://www.timothyellis.com)"
    const urls = extractAllUrls(input)
    expect(urls).toEqual(["http://www.timothyellis.com"])
  })

  it("still extracts bare https URL not inside markdown link text", () => {
    const input = "Visit https://example.com and also (https://other.com) for more"
    const urls = extractAllUrls(input)
    expect(urls).toContain("https://example.com")
    expect(urls).toContain("https://other.com")
  })
})
