<script lang="ts">
	import * as site from "$data/site"
	import ParkingNotice from "$components/ParkingNotice.svelte"
	import nebraskaMap from "../../../images/location-maps/1-nebraska.png?enhanced"
	import regionMap from "../../../images/location-maps/2-region.png?enhanced"
	import fortMap from "../../../images/location-maps/3-fort-robinson.png?enhanced"

	const maps = [
		{
			src: nebraskaMap,
			alt: "Map of Nebraska with Post Playhouse marked in the northwest corner of the state",
			title: "Northwest Nebraska",
			caption:
				"In the state's northwest corner, near the South Dakota and Wyoming borders.",
		},
		{
			src: regionMap,
			alt: "Map showing Post Playhouse in Fort Robinson State Park, west of Crawford and Chadron on US 20",
			title: "Fort Robinson State Park",
			caption:
				"3 miles west of Crawford and about 28 miles west of Chadron on US 20.",
		},
		{
			src: fortMap,
			alt: "Map of Fort Robinson with the Post Playhouse building marked beside US 20, with open highway leading in from both directions",
			title: "Inside the fort",
			caption: "On the east side of US 20, near all the buildings in the fort.",
		},
	]

	const destination = "Post Playhouse, 3200 Highway 20, Crawford, NE 69339"
	const directions = [
		{
			name: "Google Maps",
			href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&destination_place_id=ChIJU9UYIeg1e4cRKbMoq-LycEI`,
		},
		{
			name: "Apple Maps",
			href: `https://maps.apple.com/directions?destination=${encodeURIComponent(destination)}`,
		},
		{
			// OSM has no named entry for the theatre, so route to its building.
			name: "OpenStreetMap",
			href: "https://www.openstreetmap.org/directions?to=42.66756%2C-103.46410",
		},
	]
</script>

<svelte:head>
	<title>Post Playhouse: About</title>
</svelte:head>

<p class="mb-8">{site.description}</p>

<h2 class="h2">Contact</h2>

<h3 class="h3 mt-4">Box Office</h3>
<p>
	<a class="link-green" href={site.boxOfficePhoneLink}>{site.boxOfficePhone}</a
	><br />
	<a class="link-green" href="mailto:tickets@postplayhouse.com"
		>tickets@postplayhouse.com</a
	>
</p>

<h3 class="h3 mt-4">Auditions</h3>
<p>
	Please visit <a class="link-green" href="/jobs">the jobs page</a> for more information
</p>

<h3 class="h3 mt-4">Artistic Director</h3>
<p>
	Dewayne Barrett: <a
		class="link-green"
		href="mailto:dewaynebarrett@postplayhouse.com"
		>dewaynebarrett@postplayhouse.com</a
	>
</p>

<h3 class="h3 mt-4">Mailing address</h3>
<p>
	Post Playhouse<br />
	P.O. Box 365<br />
	Crawford, NE 69339
</p>

<h2 class="h2 mt-4">Location</h2>

<p>
	Post Playhouse is located in historic Fort Robinson State Park in northwestern
	Nebraska. To get driving directions to the theatre follow one of the links
	below.
</p>

<ul>
	{#each directions as { name, href } (name)}
		<li>
			<a class="link-green" {href} target="_blank">{name}</a>
			— to the theatre
		</li>
	{/each}
</ul>

<ol class="my-6 grid list-none gap-6 pl-0 md:grid-cols-3 md:gap-4">
	{#each maps as { src, alt, title, caption } (title)}
		<li>
			<figure>
				<enhanced:img
					{src}
					{alt}
					sizes="(min-width: 768px) 33vw, 100vw"
					class="h-auto w-full rounded-sm border border-gray-300 dark:border-gray-700"
				></enhanced:img>
				<figcaption class="mt-2 text-sm">
					<strong class="block">{title}</strong>
					{caption}
				</figcaption>
			</figure>
		</li>
	{/each}
</ol>

<p class="mb-6 text-xs">
	Map data ©
	<a class="link-green" href="https://www.openstreetmap.org/copyright"
		>OpenStreetMap contributors</a
	>
</p>

<ParkingNotice />
