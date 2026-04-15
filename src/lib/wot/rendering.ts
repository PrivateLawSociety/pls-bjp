import { mount, type Component, type ComponentProps } from 'svelte';

export function renderVirtualSvelteElement<T extends Component<any>>(
	SvelteComponent: T,
	props: ComponentProps<T>
): HTMLElement {
	const container = document.createElement('div');

	mount(SvelteComponent, {
		target: container,
		props: props as Record<string, unknown>
	});

	return container.children[0] as HTMLElement;
}
