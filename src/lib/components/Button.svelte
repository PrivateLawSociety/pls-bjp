<script>
	export let disabled = false;
	export let styles = '';

	const normalStyles = 'border-pls-blue-100 text-pls-blue-100';
	const disabledStyles = 'border-gray-300 text-gray-300 cursor-not-allowed';

	$: styles += disabled ? disabledStyles : normalStyles;
</script>

<button
	{disabled}
	on:click
	class="border border-2 rounded-md px-3 py-1 text-sm bg-white hover:underline {styles} transition-colors"
>
	<slot />
</button>
