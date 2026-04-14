<script lang="ts">
	import { ReviewEvent } from '$lib/wot/index';
	import { relayList, relayPool } from '$lib/wot/nostr';

	let personPubkey = '';

	let reviewList: string[] = [];

	function handleSubmit() {
		relayPool.subscribeMany(
			relayList,
			{
				authors: [personPubkey],
				kinds: [ReviewEvent]
			},
			{
				onevent(e) {
					console.log('event:', e.content);
				}
			}
		);
	}
</script>

<form
	on:submit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
	class="flex flex-col items-center"
>
	<label class="flex w-1/2 flex-col">
		Person pubkey
		<input class="border-2" bind:value={personPubkey} type="text" />
	</label>

	<button type="submit">Search</button>
</form>

{#each reviewList as review}{/each}
