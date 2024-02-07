type Post = {
	content: string
	title: string
	website: boolean
	feed: boolean
}

export async function load(obj) {
	const r = await obj.fetch(`/jobs.json`)
	const posts = (await r.json()) as Post[]
	return { posts: posts.reverse() }
}
