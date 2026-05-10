interface Window {
	turnstile: {
		render: (container: HTMLElement, options: {
			sitekey: string;
			callback: (token: string) => void;
			theme?: string;
			size?: string;
		}) => string;
		reset: (widgetId: string) => void;
	};
}
