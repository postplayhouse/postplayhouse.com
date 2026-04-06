import { describe, it, expect } from "vitest"
import {
  isOnlyBoardMember,
  hasStaffPositions,
  fullName,
  partitionPeople,
} from "./basecamp-people"

describe("isOnlyBoardMember", () => {
  it("returns true when groups is only board", () => {
    expect(isOnlyBoardMember({ groups: ["board"] })).toBe(true)
  })

  it("returns false when groups includes staff alongside board", () => {
    expect(isOnlyBoardMember({ groups: ["board", "staff"] })).toBe(false)
  })

  it("returns false when groups is absent", () => {
    expect(isOnlyBoardMember({})).toBe(false)
  })

  it("returns false when groups includes non-board", () => {
    expect(isOnlyBoardMember({ groups: ["staff"] })).toBe(false)
  })
})

describe("hasStaffPositions", () => {
  it("returns true when staff_positions is a non-empty array", () => {
    expect(hasStaffPositions({ staff_positions: ["Artistic Director"] })).toBe(true)
  })

  it("returns false when staff_positions is absent", () => {
    expect(hasStaffPositions({})).toBe(false)
  })

  it("returns false when staff_positions is empty", () => {
    expect(hasStaffPositions({ staff_positions: [] })).toBe(false)
  })
})

describe("fullName", () => {
  it("combines first and last name", () => {
    expect(fullName({ first_name: "Don", last_name: "Denton" })).toBe("Don Denton")
  })
})

describe("partitionPeople", () => {
  const basecampPeople = [
    { id: 1, name: "Alice Smith" },
    { id: 2, name: "Bob Jones" },
  ]
  const emailManifest = new Map([
    ["Carol White", "carol@example.com"],
    ["Dave Brown", "dave@example.com"],
  ])

  it("grants access to people already in Basecamp", () => {
    const people = [{ first_name: "Alice", last_name: "Smith" }]
    const result = partitionPeople(people, basecampPeople, emailManifest)
    expect(result.grant).toEqual([1])
    expect(result.create).toHaveLength(0)
    expect(result.skip).toHaveLength(0)
  })

  it("creates invitations for people with an email but no Basecamp account", () => {
    const people = [{ first_name: "Carol", last_name: "White" }]
    const result = partitionPeople(people, basecampPeople, emailManifest)
    expect(result.create).toEqual([{ name: "Carol White", email_address: "carol@example.com" }])
    expect(result.grant).toHaveLength(0)
    expect(result.skip).toHaveLength(0)
  })

  it("skips people with no Basecamp account and no email", () => {
    const people = [{ first_name: "Unknown", last_name: "Person" }]
    const result = partitionPeople(people, basecampPeople, emailManifest)
    expect(result.skip).toEqual(["Unknown Person"])
    expect(result.grant).toHaveLength(0)
    expect(result.create).toHaveLength(0)
  })
})
