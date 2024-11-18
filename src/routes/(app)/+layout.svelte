<script lang="ts">
	import MainLayout from "$components/layouts/MainLayout.svelte"
	let { children } = $props()
</script>

<MainLayout>
	{@render children?.()}
</MainLayout>
