<script lang="ts">
	import { Button } from 'flowbite-svelte';
</script>

<div class="flex items-center justify-center min-h-screen w-full p-4">
	<div class="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
		<div class="flex flex-col items-center space-y-6">
			<h1 class="text-3xl text-center text-pls-blue-100 font-bold mb-6">Create Contract</h1>
			<ul class="space-y-3 text-pls-blue-100">
				<li class="flex items-start">
					<span class="mr-2">•</span>
					<span>Only one of the involved parties should create the contract here.</span>
				</li>
				<li class="flex items-start">
					<span class="mr-2">•</span>
					<span>After created, the other involved parties will just sign the contract.</span>
				</li>
			</ul>

			<div class="flex justify-center pt-4">
				<a href="/contract/create/1">
					<Button
						color="none"
						class="bg-white text-pls-blue-100 border-2 border-pls-blue-100 hover:bg-pls-blue-50 hover:text-white transition-colors px-8 py-2"
					>
						Next
					</Button>
				</a>
			</div>
		</div>
	</div>
</div>
