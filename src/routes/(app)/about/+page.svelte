<script lang="ts">
	import site from "$data/site"
	import ParkingNotice from "$components/ParkingNotice.svelte"
</script>

<svelte:head>
	<title>Post Playhouse: About</title>
</svelte:head>

<p class="mb-8">{site.description}</p>

<h2 class="h2">Contact</h2>

<h3 class="h3 mt-4">Box Office</h3>
<p>
	<a class="link-green" href="{site.boxOfficePhoneLink}"
		>{site.boxOfficePhone}</a
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

<h3 class="h3 mt-4">Managing Director</h3>
<p>
	Ken Phillips: <a
		class="link-green"
		href="mailto:kenphillips@postplayhouse.com">kenphillips@postplayhouse.com</a
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
	Post Playhouse, Inc. produces its summer season at the theatre located on Fort
	Robinson State Park in northwestern Nebraska. To get driving directions to the
	theatre follow one of the links below.
</p>

<ul>
	<li>
		<a
			class="link-green"
			href="https://duckduckgo.com/?va=e&t=hq&q=Post+Playhouse&ia=web&iaxm=directions&end=what%3APost%2520Playhouse%2Cwhere%3A3200%2520Highway%252020%252C%2520Crawford%252C%2520NE%252069339%252C%2520United%2520States&transport=drive"
			target="_blank"
		>
			Apple Maps (via DuckDuckGo)
		</a>
		— to the theatre
	</li>
	<li>
		<a
			class="link-green"
			href="https://www.google.com/maps/dir//42.6675597,-103.4641791/@42.6675302,-103.5465798,12z?entry=ttu"
			target="_blank"
		>
			Google Maps
		</a>
		— to the theatre
	</li>
</ul>

<div class="w-full max-w-2xl my-4">
	<div class="r-16x9">
		<iframe
			class="r-child"
			width="604"
			height="350"
			title="Map showing Post Playhouse's location"
			frameborder="0"
			scrolling="no"
			marginheight="0"
			marginwidth="0"
			src="https://maps.google.com/maps/ms?f=q&amp;hl=en&amp;geocode=&amp;ie=UTF8&amp;msa=0&amp;msid=215815128770604665825.00045338a29dc15cb2d92&amp;ll=42.668963,-103.464013&amp;spn=0.003826,0.009656&amp;t=m&amp;output=embed"
		></iframe>
	</div>
</div>

<ParkingNotice />
