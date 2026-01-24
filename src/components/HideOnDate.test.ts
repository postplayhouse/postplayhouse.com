import { test, expect, vi, beforeEach, afterEach } from "vitest"
import { render } from "@testing-library/svelte"
import { createRawSnippet } from "svelte"

import HideOnDate from "./HideOnDate.svelte"

beforeEach(() => {
	vi.useFakeTimers()
})

afterEach(() => {
	vi.useRealTimers()
})

function textSnippet(text: string) {
	return createRawSnippet(() => ({
		render: () => `<span>${text}</span>`,
		setup: () => () => {},
	}))
}

test("shows content when today is before the date", () => {
	vi.setSystemTime(new Date("2026-01-01T12:00:00"))

	const { getByText } = render(HideOnDate, {
		props: {
			date: "2026-03-15",
			children: textSnippet("Visible content"),
		},
	})

	expect(getByText("Visible content")).toBeInTheDocument()
})

test("hides content when today is on the date", () => {
	vi.setSystemTime(new Date("2026-03-15T12:00:00"))

	const { queryByText } = render(HideOnDate, {
		props: {
			date: "2026-03-15",
			children: textSnippet("Hidden content"),
		},
	})

	expect(queryByText("Hidden content")).not.toBeInTheDocument()
})

test("hides content when today is after the date", () => {
	vi.setSystemTime(new Date("2026-03-16T12:00:00"))

	const { queryByText } = render(HideOnDate, {
		props: {
			date: "2026-03-15",
			children: textSnippet("Hidden content"),
		},
	})

	expect(queryByText("Hidden content")).not.toBeInTheDocument()
})
