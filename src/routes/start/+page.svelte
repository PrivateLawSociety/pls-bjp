<script lang="ts">
	import { Button, P } from 'flowbite-svelte';
</script>

<div class="flex flex-col justify-center h-full gap-4 p-4">
	<div class="flex justify-center">
		<P size="4xl" weight="normal">PLS Identity</P>
	</div>

	<div class="flex flex-col justify-center items-center h-full gap-4">
		<a href="/start/new">
			<Button class="w-48 md:w-64">New</Button>
		</a>
		<a href="/start/import">
			<Button class="w-48 md:w-64">Import / Recover</Button>
		</a>
	</div>
</div>
