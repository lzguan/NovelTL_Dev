import type { NovelGetters, SubscriberFn, TriggerEvent } from "../controller/types/controllerTypes";

type ErrorManagerGetters = {};

type ErrorTriggerEvent = { eventType: "errorOccured"; error: unknown };

/**
 * Interface for the error manager. Logs errors and provides an interface for displaying errors to the user.
 */
export interface ErrorManager {
	handleTriggerEvent: SubscriberFn<NovelGetters, TriggerEvent>;
	subscribe: (callback: SubscriberFn<ErrorManagerGetters, ErrorTriggerEvent>) => () => void;
	logError: (error: unknown) => void;
	getters: ErrorManagerGetters;
}
