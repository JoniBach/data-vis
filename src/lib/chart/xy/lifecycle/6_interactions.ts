import { handleTooltipShow, handleTooltipMove, handleTooltipHide } from '../plot/canvas.js';

type ListenerMap = {
	tooltip: (chartTooltip: any, data: any, dataKeys: any) => void;
	tooltipMove: (chartTooltip: any, event: any) => void;
	tooltipHide: (chartTooltip: any) => void;
};

// (9/10): Good modular event system, but could expand for future interactivity needs.
export const eventSystem = {
	listeners: {} as ListenerMap,
	on<T extends keyof ListenerMap>(eventType: T, callback: ListenerMap[T]) {
		this.listeners[eventType] = callback;
	},
	trigger(eventType: keyof ListenerMap, ...args: any[]) {
		const listener = this.listeners[eventType];
		if (listener) {
			(listener as (...args: any[]) => void)(...args);
		}
	}
};

// todo: currently this lifecycle stagte is being imported around the app, but it should be moved to the top of the  lifecycle

// data: make the important params

export function initializeEventHandlers(): void {
	eventSystem.on('tooltip', (chartTooltip, data, dataKeys) => {
		handleTooltipShow({ chartTooltip, data, dataKeys });
	});
	eventSystem.on('tooltipMove', (chartTooltip, event) => {
		handleTooltipMove({ chartTooltip, event });
	});
	eventSystem.on('tooltipHide', (chartTooltip) => {
		handleTooltipHide({ chartTooltip });
	});
}
