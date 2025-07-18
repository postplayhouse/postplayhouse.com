import { test, expect } from "vitest"
import { render, fireEvent } from "@testing-library/svelte"

import Comp from "./Test.svelte"

test("shows proper heading when rendered", () => {
	const { getByText } = render(Comp, { name: "World" })

	expect(getByText("Hello World!")).toBeInTheDocument()
})

// Note: This is as an async test as we are using `fireEvent`
test("changes button text on click", async () => {
	const { getByText } = render(Comp, { name: "World" })
	const button = getByText("Button")

	// Using await when firing events is unique to the svelte testing library because
	// we have to wait for the next `tick` so that Svelte flushes all pending state changes.
	await fireEvent.click(button)

	expect(button).toHaveTextContent("Button Clicked")
})
