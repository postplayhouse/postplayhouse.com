import jsdom from "jsdom"

const pageUrl = "https://public.3.basecamp.com/p/6Ks7BYKuf2KhwH4kETrPsJRR"

// fetch webpage content and parse it as HTML

async function fetchPage(url: string) {
	const response = await fetch(url)
	return await response.text()
}

const endsWithFileExtension = /\.\w{3,4}$/

function getDescription(fig: HTMLElement) {
	let description = fig.querySelector(
		"figcaption > .attachment__name",
	)?.textContent

	if (typeof description !== "string") {
		return ""
	}

	description = description.trim()

	if (endsWithFileExtension.test(description)) return ""

	return description
}

function getImgDetailsFromBasecampFigure(fig: HTMLElement) {
	const src = fig.querySelector("img")?.src
	if (typeof src !== "string") {
		return null
	}

	return {
		src,
		description: getDescription(fig),
	}
}

function exists<T>(value: T | null | undefined): value is T {
	return value !== null && value !== undefined
}

async function getImages() {
	const doc = await fetchPage(pageUrl)
	const dom = new jsdom.JSDOM(doc)
	const figures = Array.from(
		dom.window.document.querySelectorAll<HTMLElement>("bc-attachment"),
	)
	return figures.map(getImgDetailsFromBasecampFigure).filter(exists)
}

export async function load() {
	return {
		images: await getImages(),
	}
}
