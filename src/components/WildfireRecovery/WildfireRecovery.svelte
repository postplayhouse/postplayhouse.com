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
			season at Post Playhouse. Today, we’re grateful to share part of our
			Comeback Story.
		</p>
		<p>
			Thanks to the generosity of our incredible supporters near and far, nearly
			$5,000 has already been raised toward our $45,000 Wildfire Recovery Fund
			goal. Every gift has had an impact on our artistry and work, our spirits,
			and our communities here in Northwest Nebraska.
		</p>
	</div>

	<!-- Containing block for the sticky CTA; keeps it below the header above. -->
	<div>
		<div class="space-y-3 pt-3">
			<p>
				Like so many businesses, attractions, and organizations across Northwest
				Nebraska, Post Playhouse depends on a strong summer season. For nearly
				60 years, we have brought people together and contributed to the summer
				experience at Fort Robinson State Park– part of what makes this region
				so special.
			</p>
			<p>
				While the emergency phase of the South Fork Fire has passed, the impact
				of 3 cancelled performances, emergency and evacuation expenses, and lost
				attendance during this important moment in our season, is still deeply
				felt at our nonprofit theatre.
			</p>
			<p>
				Our recovery continues as we write Post Playhouse’s next chapter of
				Northwest Nebraska’s story. If Post Playhouse has ever been part of your
				story, or if you simply want to support the recovery of a region that
				relies on summer tourism, we invite you to play a critical role in our
				Comeback Story and make a gift today.
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
