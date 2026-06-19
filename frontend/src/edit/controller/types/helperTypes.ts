import { type IDRepository } from "./idTypes";
import { Brand, Effect } from "effect";
import type { NotFoundException } from "./errors";
import type { ReservationRequest, ReserveList } from "./requestTypes";

/**
 * Type that certifies that a callback with no parameters is idempotent, meaning that multiple calls to this callback will return the same value and have the same effect as a single call.
 */
export type IdempotentCallable<T> = Brand.Brand<"IdempotentCallable"> & (() => T);

/**
 * Constructor for an IdempotentCallable. Makes a function idempotent by caching its result and ensuring that subsequent calls return the cached result without calling the original function again.
 */
export const IdempotentCallable = <T>(fn: () => T): IdempotentCallable<T> => {
	let called = false;
	let result: T;
	const callable = () => {
		if (!called) {
			result = fn();
			called = true;
		}
		return result;
	};
	return Brand.nominal<IdempotentCallable<T>>()(callable);
};

/**
 * A provisional value is a data representation of some resource that exists strictly on the frontend. It is used as a placeholder for a corresponding server resource that may or may not exist yet, and can be used to make requests to the backend to create or modify the corresponding server resource.
 */
export type Prov<T> = T & Brand.Brand<"Prov">;

/**
 * Constructor for a Prov. Brands a value as a Prov. Mostly used for type safety and clarity.
 */
export function Prov<T>(value: Brand.Brand.Unbranded<Prov<T>>): Prov<T> {
	return Brand.nominal<Prov<T>>()(value);
}

/**
 * Checks whether all entries in a ReserveList are reserveable for their desired states.
 * Short-circuits on first false.
 *
 * @param idRepo - ID repository to check reservation state against.
 * @param list - Reserve list to validate.
 * @returns true if all reserveable, false otherwise.
 */
export const isAllReserveable = (
	idRepo: IDRepository,
	list: ReserveList,
): Effect.Effect<boolean, NotFoundException> =>
	Effect.gen(function* () {
		for (const { kind, id, desiredState } of list.chapter) {
			const reserveable = yield* idRepo.isReserveable(kind, id, desiredState);
			if (!reserveable) return false;
		}
		for (const { kind, id, desiredState } of list.chapterContent) {
			const reserveable = yield* idRepo.isReserveable(kind, id, desiredState);
			if (!reserveable) return false;
		}
		for (const { kind, id, desiredState } of list.label) {
			const reserveable = yield* idRepo.isReserveable(kind, id, desiredState);
			if (!reserveable) return false;
		}
		for (const { kind, id, desiredState } of list.labelData) {
			const reserveable = yield* idRepo.isReserveable(kind, id, desiredState);
			if (!reserveable) return false;
		}
		for (const { kind, id, desiredState } of list.labelGroup) {
			const reserveable = yield* idRepo.isReserveable(kind, id, desiredState);
			if (!reserveable) return false;
		}
		return true;
	});

/**
 * Convenience constructor for simple reservation requests where wait() = "are all IDs reserveable?".
 * For complex cases (custom wait logic, dynamic reserve lists), construct ReservationRequest manually.
 *
 * @param idRepo - ID repository for reservation checks.
 * @param reserveList - Static list of reservations. Wrapped in IdempotentCallable internally.
 * @param skip - Optional predicate; if true, the request is skipped entirely. Defaults to () => false.
 */
export function makeReservationRequest(
	idRepo: IDRepository,
	reserveList: ReserveList,
	skip?: () => boolean,
): ReservationRequest {
	return {
		reserveList: IdempotentCallable(() => reserveList),
		skip: skip ?? (() => false),
		wait: () => isAllReserveable(idRepo, reserveList).pipe(Effect.map((ready) => !ready)),
	};
}
