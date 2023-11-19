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
			href="http://www.bing.com/maps/?v=2&amp;cp=r3b57g6cb5p3&amp;lvl=18&amp;dir=0&amp;sty=b&amp;sp=Point.r3b4xz6cb5sc_Post%20Playhouse_Post%20Playhouse%20is%20located%20in%20Historic%20Fort%20Robinson%20State%20Park%2C%20and%20is%20Northwestern%20Nebraska's%20Premiere%20venue%20for%20live%20theatre._http%3A%2F%2Fwww.postplayhouse.com_http%3A%2F%2Fwww.postplayhouse.com%2Fwordpress%2Fwp-content%2Fthemes%2Fpostplayhouse2.1%2Fimages%2Fplayhouse%255fpic.jpg_"
			target="_blank"
		>
			Bing Maps
		</a>
		— to the theatre
	</li>
	<li>
		<a
			class="link-green"
			href="http://maps.google.com/maps/ms?f=q&amp;hl=en&amp;geocode=&amp;ie=UTF8&amp;msa=0&amp;ll=42.668963,-103.464013&amp;spn=0.003826,0.009656&amp;z=17&amp;iwstate1=dir&amp;msid=113724959975087314194.00045338a29dc15cb2d92"
			target="_blank"
		>
			Google Maps
		</a>
		— to the theatre
	</li>
	<li>
		<a
			class="link-green"
			href="http://www.mapquest.com/maps?state=NE&amp;cat=fort+robinson+state+park"
			target="_blank"
		>
			MapQuest
		</a>
		— to Fort Robinson
	</li>
	<li>
		<a
			class="link-green"
			href="http://maps.yahoo.com/#mvt=m&amp;lat=42.66546&amp;lon=-103.460484&amp;zoom=16&amp;tt=fort
      robinson state park&amp;tp=1"
			target="_blank"
		>
			Yahoo Maps
		</a>
		— to Fort Robinson
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
	<small>
		View
		<a
			href="https://maps.google.com/maps/ms?f=q&amp;hl=en&amp;geocode=&amp;ie=UTF8&amp;msa=0&amp;msid=215815128770604665825.00045338a29dc15cb2d92&amp;ll=42.668963,-103.464013&amp;spn=0.003826,0.009656&amp;t=m&amp;source=embed"
			class="link-green"
		>
			the theatre
		</a>
		in a larger map
	</small>
</div>

<ParkingNotice />
