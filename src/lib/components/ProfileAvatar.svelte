<script lang="ts">
	export let source;
	export let alt = '';
	export let size = 10;

	let imageError = false;
</script>

{#if imageError || !source}
	<div class={`relative h-${size} w-${size} overflow-hidden rounded-full bg-gray-600`}>
		<svg
			class="absolute h-full w-full text-gray-400"
			fill="currentColor"
			viewBox="0 0 20 16"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fill-rule="evenodd"
				d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
				clip-rule="evenodd"
			/>
		</svg>
	</div>
{:else}
	<img
		class={`h-${size} w-${size} rounded-full object-cover`}
		src={source}
		{alt}
		on:error={() => (imageError = true)}
	/>
{/if}
