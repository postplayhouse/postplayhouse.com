<script lang="ts">
	import { dev } from "$app/environment"
	import site from "$data/site"

	type Props = {
		activePath: string
	}
	let { activePath }: Props = $props()

	function trimTrailingSlash(str: string) {
		return str.replace(/\/$/, "")
	}

	function nodeIsActive(node: HTMLAnchorElement, activePath: string) {
		return (
			trimTrailingSlash(new URL(node.href).pathname) ===
			trimTrailingSlash(activePath)
		)
	}

	function manageNodeActiveClass(node: HTMLAnchorElement, activePath: string) {
		if (nodeIsActive(node, activePath)) {
			node.classList.add("active")
			// TODO add aria-active="page"
		} else {
			node.classList.remove("active")
			// TODO add aria-active="page"
		}
	}

	function active(node: HTMLAnchorElement, activePath: string) {
		manageNodeActiveClass(node, activePath)

		return {
			update(activePath: string) {
				manageNodeActiveClass(node, activePath)
			},
		}
	}
</script>

<nav class="main-nav mx-auto max-w-4xl">
	<ul class="w-fit">
		<li>
			<a use:active={activePath} href="/productions/{site.season}">
				Our Productions
			</a>
		</li>
		<li>
			<a use:active={activePath} href="/calendar/{site.season}">Calendar</a>
		</li>
		<li>
			<a use:active={activePath} href="/plan-your-visit">Plan Your Visit</a>
		</li>
		<li><a use:active={activePath} href="/gifts">Gifts</a></li>
		<li>
			<a use:active={activePath} href="/who/{site.season}">Who's Who</a>
		</li>
		<li><a use:active={activePath} href="/jobs">Jobs</a></li>
		<li><a use:active={activePath} href="/support">Support</a></li>
		<li><a use:active={activePath} href="/about">About</a></li>
		<li><a use:active={activePath} href="/media">Image Gallery</a></li>
		{#if dev}<li>
				<a use:active={activePath} class="text-red-400" href="/debug">Debug</a>
			</li>{/if}
	</ul>
</nav>

<style>
	nav {
		border-bottom: 1px solid rgba(62, 155, 50, 0.1);
		padding: 0 1em;
	}

	@media (prefers-color-scheme: dark) {
		nav {
			border-color: rgba(62, 155, 50, 0.3);
		}
	}

	ul {
		padding: 0;
	}

	/* flow-root */
	ul::after {
		content: "";
		display: block;
		clear: both;
	}

	li {
		display: block;
		float: left;
	}

	.main-nav :global(.active) {
		position: relative;
		display: inline-block;
	}

	.main-nav :global(.active::after) {
		position: absolute;
		content: "";
		width: calc(100% - 1em);
		height: 2px;
		background-color: rgb(62, 155, 50);
		display: block;
		bottom: -1px;
	}

	a {
		text-decoration: none;
		padding: 1em 0.5em;
		display: block;
	}
</style>
