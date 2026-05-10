<script lang="ts">
	let { onVerify }: { onVerify: (token: string) => void } = $props();

	let container: HTMLDivElement;

	$effect(() => {
		if (!container) return;

		const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
		if (!siteKey) {
			onVerify('dev-bypass');
			return;
		}

		function render() {
			if (window.turnstile) {
				window.turnstile.render(container, {
					sitekey: siteKey,
					callback: (token: string) => onVerify(token),
					theme: 'light',
					size: 'flexible'
				});
			}
		}

		if (window.turnstile) {
			render();
		} else {
			const script = document.createElement('script');
			script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
			script.async = true;
			(window as any).onTurnstileLoad = render;
			document.head.appendChild(script);
		}
	});
</script>

<div bind:this={container} class="mt-3"></div>
