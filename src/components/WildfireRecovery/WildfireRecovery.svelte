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
			The week of June 8, 2026, wildfire temporarily disrupted our season at
			Fort Robinson State Park.
		</p>
		<p>
			Our entire company was safely evacuated, and thanks to firefighters and
			emergency crews, the historic fort and surrounding area were protected. We
			are deeply grateful.
		</p>
	</div>

	<!-- Containing block for the sticky CTA; keeps it below the header above. -->
	<div>
		<div class="space-y-3 pt-3">
			<p>
				While Fort Robinson has reopened, the start of our season was
				significantly impacted—three performances were cancelled, emergency
				expenses were incurred, and attendance has been affected during a
				critical time for our nonprofit theatre.
			</p>
			<p>
				Post Playhouse depends on ticket sales and community support to bring
				professional theatre to the Nebraska Panhandle each summer.
			</p>
			<p>
				We are launching a Wildfire Recovery Fund with a goal of $45,000 to help
				us recover and sustain the remainder of the season.
			</p>
			<p>
				Your gift will cover emergency costs, help support our artists and
				staff, and keep professional theatre thriving at Fort Robinson.
			</p>
			<p>
				If Post Playhouse has ever been part of your Fort Robinson story, we
				hope you’ll consider making a gift today.
			</p>
			<p class="font-medium">
				Wildfire may have interrupted our season, but it did not end it.
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
