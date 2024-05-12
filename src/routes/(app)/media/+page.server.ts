import jsdom from "jsdom"

const page = "https://public.3.basecamp.com/p/6Ks7BYKuf2KhwH4kETrPsJRR"

// fetch webpage content and parse it as HTML

async function fetchPage(url: string) {
	const response = await fetch(url)
	const text = await response.text()
	const doc = new jsdom.JSDOM(text)
	return doc
}

async function getImages() {
	const doc = await fetchPage(page)
	const figures = Array.from(
		doc.window.document.querySelectorAll<HTMLElement>("bc-attachment"),
	)
	return figures
		.map((fig) => {
			return {
				src: fig.querySelector("img")?.src,
				description: (
					fig.querySelector("figcaption .attachment__name")?.textContent || ""
				).trim(),
			}
		})
		.filter((img) => typeof img.src === "string")
}

export async function load() {
	return {
		images: await getImages(),
	}
}
