<script lang="ts">
	import { getProfileMetadata, parseProfileFromJsonString, type ProfileType } from '$lib/wot/nostr';
	import { npubEncode } from 'nostr-tools/nip19';
	import ProfileAvatar from './ProfileAvatar.svelte';

	export let pubkey: string;
	export let hideName = false;
	export let divClass = '';
	export let size = 14;

	let profileMetadata: ProfileType | undefined = undefined;

	function shortNpub(pk: string) {
		try {
			const npub = npubEncode(pk);
			return `${npub.slice(0, 10)}…${npub.slice(-4)}`;
		} catch {
			return '';
		}
	}

	// When pubkey is empty → logged out state. When pubkey is set but the
	// profile hasn't loaded yet (or the account has no kind-0 metadata /
	// no name field), fall back to the truncated npub so the user sees
	// their own identity instead of a misleading "Not logged in" label.
	$: username = pubkey
		? (profileMetadata?.displayName ?? profileMetadata?.name ?? shortNpub(pubkey))
		: 'Not logged in';

	async function loadProfile(pk: string) {
		profileMetadata = undefined;
		if (!pk) return;

		const event = await getProfileMetadata(pk);
		if (!event) return;
		if (pk !== pubkey) return; // prop changed while awaiting — abort

		profileMetadata = parseProfileFromJsonString(event.content || '{}', {
			npub: npubEncode(pk),
			pubkey: pk
		});
	}

	$: loadProfile(pubkey);
</script>

<a href="/wot/keys" class="flex flex-col items-center justify-center {divClass}">
	<ProfileAvatar source={profileMetadata?.picture} alt={username} {size} />
	{#if !hideName}
		<p title={username} class="w-24 break-all text-center mt-2 text-sm">{username}</p>
	{/if}
</a>
