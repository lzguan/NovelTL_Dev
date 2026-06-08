import type { InFlightIdStatus, Kind, ProvId } from "./idTypes";
import { type IdempotentCallable } from "./helperTypes";
import type { Effect } from "effect";
import type { CacheConflictError, ConnectionError, FatalError } from "./errors";
import type { CacheEntry } from "@/api/models";

type CachedResultOutput =
	| { status: "success"; error: null }
	| { status: "pending"; error: null }
	| { status: "failure"; error: Error };

export type RequestVariant =
	| "addLabelGroup"
	| "textOp"
	| "labelOp"
	| "addLabelData"
	| "reloadGroup";

export type Reservation = {
	kind: Kind;
	id: ProvId;
	desiredState: InFlightIdStatus;
};

export type ReservationRequest = {
	reserveList: IdempotentCallable<Reservation[]>;
	/**
	 * Skip this request if this function returns true provided that wait() returns false.
	 */
	skip: () => boolean;
	/**
	 * Wait to send this request until this function returns false. If not provided, the request manager will not delay this request.
	 */
	wait: () => boolean;
};

export type BaseRequestEvent = {
	reservationRequest: ReservationRequest;
	variant: RequestVariant;
	onFailure: () => void; // handler that will be called if the request fails after all retries, with the error that caused the failure
	onFatalError: (err: Error) => void; // handler that will be called if the request encounters a fatal error
	retries: number;
	active: boolean;
};
export type NoCachedRequestEvent = BaseRequestEvent & {
	handleCachedResult?: never;
	callback: (requestKey: string) => Effect.Effect<void, ConnectionError | FatalError>;
};

export type CachedRequestEvent = BaseRequestEvent & {
	handleCachedResult: (cachedResult: CacheEntry, requestKey: string) => CachedResultOutput;
	callback: (
		requestKey: string,
	) => Effect.Effect<void, ConnectionError | FatalError | CacheConflictError>;
};

export type RequestEvent = CachedRequestEvent | NoCachedRequestEvent;

export type NoCachedKeyedRequestEvent = NoCachedRequestEvent & { requestKey: string };
export type CachedKeyedRequestEvent = CachedRequestEvent & { requestKey: string };

export type KeyedRequestEvent = NoCachedKeyedRequestEvent | CachedKeyedRequestEvent;

export type RequestManager<TriggerEventT> = {
	isQueueEmpty: () => boolean;
	enqueueRequest: (request: RequestEvent) => void;

	debounce: () => void;
	send: () => Effect.Effect<number, number>; // returns null if no delay is needed or the delay until the next retry if a request was sent and needs to be retried
	start: () => Effect.Effect<void>;
	waitFlush: () => Effect.Effect<void>; // await flush queue

	attachTrigger: (trigger: (t: TriggerEventT) => void) => void;
	detachTrigger: () => void;
};
