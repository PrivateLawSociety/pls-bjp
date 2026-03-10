<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { Navbar, NavBrand, NavHamburger, NavUl } from 'flowbite-svelte';
	import HeaderPerson from '$lib/components/HeaderPerson.svelte';
	import { nostrAuth } from '$lib/nostr';
</script>

<div class="flex flex-col h-screen">
	<div>
		<Navbar
			let:hidden
			let:toggle
			color="none"
			class="bg-white border-b border-gray-200"
		>
			<div class="hidden md:grid md:grid-cols-3 items-center w-full">
				<NavBrand href="/" class="items-center gap-4 justify-self-start">
					<button
						class="border border-2 rounded-md border-pls-blue-100 px-4 py-1 text-pls-blue-100 hover:underline text-lg {$page.url.pathname === '/' ? 'invisible' : ''}"
						on:click={() => history.back()}
					>
						Back
					</button>
					<img src="/logo.svg" class="mr-3 h-10" alt="PLS Logo" />
				</NavBrand>

				<p class="text-pls-blue-100 text-4xl font-bold justify-self-center">BJP</p>

				<div class="flex items-center gap-4 justify-self-end">
					<a
						href="https://github.com/PrivateLawSociety/pls-mvp/blob/main/README.md"
						target="_blank"
						rel="noopener noreferrer"
						class="text-pls-blue-100 hover:underline text-lg"
					>
						Guide
					</a>

					{#if $nostrAuth?.pubkey}
						<HeaderPerson pubkey={$nostrAuth.pubkey} />
					{/if}
				</div>
			</div>

			<div class="flex md:hidden items-center justify-between w-full">
				<NavBrand href="/" class="flex items-center gap-2">
					<button
						class="border border-2 rounded-md border-pls-blue-100 px-3 py-1 text-pls-blue-100 text-sm {$page.url.pathname === '/' ? 'invisible' : ''}"
						on:click={() => history.back()}
					>
						Back
					</button>
					<img src="/logo.svg" class="h-8" alt="PLS Logo" />
				</NavBrand>

				<p class="text-pls-blue-100 text-2xl font-bold">BJP</p>

				<NavHamburger color="none" class="bg-pls-blue-50" on:click={toggle} />
			</div>

			<NavUl
				{hidden}
				class="md:hidden mt-2"
				ulClass="!bg-white !p-4 border-0"
			>
				<div class="w-full flex flex-col items-center gap-6">
					<a
						href="https://github.com/PrivateLawSociety/pls-mvp/blob/main/README.md"
						target="_blank"
						rel="noopener noreferrer"
						class="text-pls-blue-100 hover:underline text-lg font-medium"
					>
						Guide
					</a>

					{#if $nostrAuth?.pubkey}
						<HeaderPerson pubkey={$nostrAuth.pubkey} />
					{/if}
				</div>
			</NavUl>
		</Navbar>
	</div>
	<slot />
</div>
