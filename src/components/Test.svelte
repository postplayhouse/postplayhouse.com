<script lang="ts">
	let { name }: { name: string } = $props()

	let buttonText = $state("Button")

	function handleClick() {
		buttonText = "Button Clicked"
	}
</script>

<h1>Hello {name}!</h1>

<button onclick={handleClick}>{buttonText}</button>
