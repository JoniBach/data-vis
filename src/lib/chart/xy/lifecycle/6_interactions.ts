// **6. Interractivity stage**

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

/**
 * This phase is responsible for adding interactivity to the chart, such as handling tooltips and other event-based
 * interactions. By attaching event listeners and managing their corresponding handlers, this phase enhances user
 * engagement by allowing them to interact directly with the chart elements, such as bars, points, or bubbles.
 *
 * The purpose of this step is to make the chart more dynamic and interactive. This is particularly useful for
 * exploratory data analysis, where users need additional information (e.g., tooltips showing detailed data) when
 * hovering over or interacting with different data points. The system listens for specific events like `mouseover`,
 * `mousemove`, and `mouseout` and triggers the corresponding tooltip actions to provide contextual insights.
 *
 * This phase is designed to be **modular** and **scalable**. The `eventSystem` is built to handle multiple types
 * of interactivity features and can easily be extended to support future event types beyond tooltips. By using
 * an event-based architecture, the system remains flexible and can support various types of user interaction, such
 * as highlighting data points or triggering additional chart features.
 *
 * The result of this step is a fully interactive chart, with event handlers dynamically managing tooltip visibility
 * and movement based on user interactions. The event system also allows for future expansion of interactivity
 * without significant changes to the core lifecycle process.
 */
