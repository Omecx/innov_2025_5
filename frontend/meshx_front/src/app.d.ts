// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}

	interface Window {
		ethereum?: {
			isMetaMask?: boolean;
			request: (request: { method: string; params?: any[] }) => Promise<any>;
			on: (eventName: string, callback: (...args: any[]) => void) => void;
			removeListener: (eventName: string, callback: (...args: any[]) => void) => void;
		};
	}
}

export {};