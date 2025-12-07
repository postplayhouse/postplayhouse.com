import { marked } from "marked"

import postsData from "../_posts-metadata"
import { PUBLIC_BUILD_URL } from "$env/static/public"
import { asset } from "$app/paths"

const professionalsPage = `${PUBLIC_BUILD_URL}/jobs`

export const feed = {
	updatedDate: new Date().toISOString(),
	htmlLink: professionalsPage,
	title: "Post Playhouse Job Openings and Auditions",
	description:
		"Though the latest information is available on the site, we update this feed when new job opportunities and auditions are announced.",
	feedsUrlBase: `${professionalsPage}/feeds`,
	icon: `${PUBLIC_BUILD_URL}${asset("/images/post-playhouse-logo.png")}`,
}

const dateInNebraska = (dateArg: ConstructorParameters<typeof Date>[0]) =>
	new Date(dateArg).toISOString().replace("Z", "-07:00")

export const posts = postsData
	.filter((post) => (post as unknown as { feed: boolean }).feed)
	.map((post) => {
		return {
			author: { name: "Post Playhouse" },
			title: post.title,
			id: `${professionalsPage}/${post.year}`,
			publishedDate: dateInNebraska(post.date),
			updatedDate: dateInNebraska(post.updatedDate || post.date),
			html: marked.parse(
				post.content +
					`\n\nVisit our site for the [full job listing](${professionalsPage})`,
			),
		}
	})
