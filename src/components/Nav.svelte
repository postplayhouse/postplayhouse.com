<script lang="ts">
	export let activePath: string
	import site from "$data/site"

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

<nav class="main-nav">
	<ul class="m-auto max-w-3xl">
		<li>
			<a use:active="{activePath}" href="/productions/{site.season}">
				Our Productions
			</a>
		</li>
		<li>
			<a use:active="{activePath}" href="/calendar/{site.season}">Calendar</a>
		</li>
		<li>
			<a use:active="{activePath}" href="/plan-your-visit">Plan Your Visit</a>
		</li>
		<li><a use:active="{activePath}" href="/gifts">Gifts</a></li>
		<li>
			<a use:active="{activePath}" href="/who/{site.season}">Who's Who</a>
		</li>
		<li><a use:active="{activePath}" href="/jobs">Jobs</a></li>
		<li><a use:active="{activePath}" href="/donate">Donate</a></li>
		<li><a use:active="{activePath}" href="/about">About</a></li>
	</ul>
</nav>

<style>
	nav {
		border-bottom: 1px solid rgba(62, 155, 50, 0.1);
		padding: 0 1em;
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
