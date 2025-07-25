<script lang="ts">
	import Markdown from "$components/Markdown.svelte"
	import type yamlData from "$data/_yaml"

	type Props = { data: typeof yamlData }

	let { data }: Props = $props()

	const { businesses } = $state(data)
</script>

<h2 class="h2">Nearby Activities, Attractions, Food, and Lodging</h2>

<p class="my-8">
	If you‘d like to see your business listed here, please <a
		class="link-green"
		href="mailto:elaudeman@postplayhouse.com"
		>email our development director, Em Laudeman</a
	>. If you‘d like to donate to the playhouse, visit our
	<a href="/donate/">donations page</a>.
</p>

{#each businesses as item}
	<div class="relative" class:supporter={item.supporter}>
		<div class="mb-8 flex flex-row-reverse">
			<div class="grow bg-green-200 p-4 dark:bg-green-900/60">
				<div>
					{#if item.site}
						<a href={item.site}>
							<div class="text-2xl">{item.name}</div>
							{#if item.prettyURL}
								<div class="link-green" style="max-width: 100%">
									{item.prettyURL}
								</div>
							{:else}
								<div class="link-green" style="max-width: 100%">
									{item.site}
								</div>
							{/if}
						</a>
					{:else}
						<div class="text-2xl">{item.name}</div>
					{/if}
				</div>

				{#if item.phone}
					<div class="my-4">
						<a href="tel:+{item.phone.replace(/-/g, '')}">{item.phone}</a>
					</div>
				{/if}

				{#if item.address}
					<div class="my-4">
						{#if item.address.street}
							<div class="street">{item.address.street}</div>
						{/if}
						{#if item.address.city}
							<span class="city">
								{item.address.city}
								{#if item.address.state},{/if}
							</span>
						{/if}
						{#if item.address.state}
							<span class="state">{item.address.state}</span>
						{/if}
						{#if item.address.zip}
							<span class="zip">{item.address.zip}</span>
						{/if}
					</div>
				{/if}

				{#if item.about}
					<div class="about">
						<Markdown source={item.about} />
					</div>
				{/if}
			</div>

			<ul class="w-32 flex-none list-none bg-green-400 p-4 dark:bg-black">
				{#each item.type as type}
					<li class="mb-2">{type}</li>
				{/each}
			</ul>
		</div>
	</div>
{/each}

<div>
	<p>Fort Robinson also has lodging and activities:</p>
	<p>
		<a class="link-green" href="/documents/Fort-Rob-Accomodations.pdf">
			Fort Rob Accommodations
		</a>
		(PDF)
	</p>
	<p>
		<a class="link-green" href="/documents/Fort-Rob-Activities.pdf">
			Fort Rob Activities
		</a>
		(PDF)
	</p>
</div>

<style>
	.supporter:before {
		content: "Playhouse\aSupporter";
		white-space: pre;
		transform: rotate(15deg);
		position: absolute;
		right: -1em;
		top: -0.5em;
		color: white;
		background-color: green;
		border-radius: 8px;
		padding: 6px;
		text-align: center;
		line-height: 1;
		font-weight: 100;
	}
</style>
