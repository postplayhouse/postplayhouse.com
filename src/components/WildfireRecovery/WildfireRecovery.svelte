<script lang="ts">
	import DonateBtn from "$components/DonateBtn.svelte"
	import wildfireRecoveryImage from "./wildfire-recovery.jpg?enhanced"
</script>

<div
	class="mx-auto mb-16 block max-w-2xl border border-amber-400 bg-amber-50 p-6 shadow-md dark:border-amber-500 dark:bg-amber-900/20"
>
	<h1 class="h2 mb-2">Wildfire Recovery Fund</h1>

	<!--
		Protected header. The sticky call-to-action below is constrained to its own
		containing block (the wrapper that starts after these two paragraphs), so it
		can never scroll up over the image or the opening two paragraphs.
	-->
	<enhanced:img
		src={wildfireRecoveryImage}
		class="mb-4 w-full"
		alt="The burned landscape below the buttes of Fort Robinson State Park after the South Fork Fire"
	></enhanced:img>

	<div class="space-y-3">
		<p>
			We recently shared how the South Fork Fire disrupted the start of our
			season at Post Playhouse. Today, we’re happy to share the next chapter in
			our Comeback Story.
		</p>
		<p>
			<strong
				>Together, we reached our $45,000 Wildfire Recovery Fund goal!</strong
			>
		</p>

		<p>
			This milestone was made possible by the generosity of supporters near and
			far who believe in our mission and in the resilience of our theatre and
			our region. Every gift has strengthened us, lifted our spirits, and
			supported our communities as we heal together. We are so grateful.
		</p>
	</div>

	<!-- Containing block for the sticky CTA; keeps it below the header above. -->
	<div>
		<div class="space-y-3 pt-3">
			<p>
				For nearly 60 years, Post Playhouse has brought people together as part
				of the summer experience at Fort Robinson State Park, helping make this
				region a destination for visitors and a source of joy in our community.
			</p>
			<p>
				While we’ve reached our important fundraising goal, <strong
					>our recovery doesn’t end here.</strong
				> The impact of canceled performances, emergency and evacuation expenses,
				and lost attendance continues to affect our nonprofit theatre as we rebuild
				for this season and prepare for the future.
			</p>
			<p>
				The next chapter of our Comeback Story is still being written. If Post
				Playhouse has ever been part of your story—or if you simply want to
				invest in the recovery of our region that depends on summer tourism—you
				can still make a gift to help ensure Post Playhouse remains strong for
				seasons to come.
			</p>
			<p>
				Thank you for your generosity. And thank you for helping us turn a season
				of challenge into a Comeback Story—of resilience, hope, and community.
			</p>
		</div>

		<div
			class="sticky bottom-0 mt-6 border-t border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-900"
		>
			<p class="font-bold">
				If you’d like to make a donation to help with the Wildfire Recovery
				Fund, write “Wildfire Recovery Fund” in the “Anything you’d like us to
				know” text field on the donation form. Thank you for your support!
			</p>

			<DonateBtn>Donate to the Wildfire Recovery Fund</DonateBtn>
		</div>
	</div>
</div>
