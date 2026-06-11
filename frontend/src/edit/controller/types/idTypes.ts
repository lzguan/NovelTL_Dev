/**
 * State transitions for id objects in the repository:
 * pending -> creating
 * creating -> clean
 * clean -> updating
 * clean -> deleting
 * clean -> locked
 * locked -> locked
 * locked -> clean
 * updating -> clean
 * deleting -> deleted
 *
 * creating, updating, deleting states effectively lock this resource
 * locked state effectively makes this resource read-only, but can be reserved multiple times until all locks are released (do not use this state for writes)
 *
 * slightly outdated
 */

import { Brand, Effect } from "effect";
import type { Prov } from "./helperTypes";
import type { NotFoundException, NotReserveableException } from "./errors";

export type ProvId = Prov<string>;
export const ProvId = Brand.nominal<ProvId>();

export type ServId = string & Brand.Brand<"ServId">;
export const ServId = Brand.nominal<ServId>();

export type ServEx = true & Brand.Brand<"ServEx">;
export const ServEx = Brand.nominal<ServEx>();

export type InFlightIdStatus =
	| "creating"
	| "updating"
	| "idUpdating"
	| "deleting"
	| "locked"
	| "detaching"
	| "loading"
	| "killing";

export type GroundIdStatus = "pending" | "clean" | "deleted" | "detached" | "killed";

export type IdStatus = InFlightIdStatus | GroundIdStatus;

export function entryStatus(status: InFlightIdStatus): GroundIdStatus {
	if (status === "creating" || status === "loading" || status === "killing") {
		return "pending";
	}
	return "clean";
}

export function exitStatus(status: InFlightIdStatus): GroundIdStatus {
	if (
		status === "creating" ||
		status === "updating" ||
		status === "idUpdating" ||
		status === "locked" ||
		status === "loading"
	) {
		return "clean";
	} else if (status === "detaching") {
		return "detached";
	} else if (status === "killing") {
		return "killed";
	}
	return "deleted";
}

export function isInFlight(status: IdStatus): status is InFlightIdStatus {
	return (
		status === "creating" ||
		status === "updating" ||
		status === "idUpdating" ||
		status === "deleting" ||
		status === "locked" ||
		status === "detaching" ||
		status === "loading" ||
		status === "killing"
	);
}

export type IdentifiableKind = "labelGroup" | "labelData" | "chapterContent" | "chapter";
export type ExistableKind = "label";
export type Kind = IdentifiableKind | ExistableKind;

export type IdentifiableKindMap = {
	[K in IdentifiableKind]: Map<
		ProvId,
		{ serverId: ServId | null; status: IdStatus; lockCount: number }
	>;
};
export type ExistableKindMap = {
	[K in ExistableKind]: Map<
		ProvId,
		{ serverExists: ServEx | null; status: IdStatus; lockCount: number }
	>;
};

export function isIdentifiableKind(kind: Kind): kind is IdentifiableKind {
	return (
		kind === "labelGroup" || kind === "labelData" || kind === "chapterContent" || kind === "chapter"
	);
}

type ActionHappened = boolean & Brand.Brand<"ActionHappened">;
export const ActionHappened = Brand.nominal<ActionHappened>();

/**
 * Used for managing existence of ids, not state
 */
export interface IDRepository {
	/**
	 * Create a new id and manage it in the repository.
	 */
	newId(kind: Kind): ProvId;

	/**
	 * Create a new id, bind it to the given server id, and manage it in the repository.
	 */
	newIdAndBindId(kind: IdentifiableKind, serverId: ServId): ProvId;
	newIdAndBindExists(kind: ExistableKind): ProvId;

	/**
	 * Get the server id corresponding to a provisional id. If server id has not been bound yet, return null.
	 */
	getServerId(
		kind: IdentifiableKind,
		provisionalId: ProvId,
	): Effect.Effect<ServId | null, NotFoundException>;
	getServerExists(
		kind: ExistableKind,
		provisionalId: ProvId,
	): Effect.Effect<ServEx | null, NotFoundException>;

	/**
	 * Bind a provisional id to a server id, so that the controller can update the corresponding entry with the new server id when it receives the signal from the request event.
	 */
	bindServerId(
		kind: IdentifiableKind,
		provisionalId: ProvId,
		serverId: ServId,
	): Effect.Effect<void, NotFoundException>;
	bindServerExists(
		kind: ExistableKind,
		provisionalId: ProvId,
	): Effect.Effect<void, NotFoundException>;

	idObjState(kind: Kind, id: ProvId): Effect.Effect<IdStatus, NotFoundException>;

	isReserveable(
		kind: Kind,
		id: ProvId,
		desiredState: InFlightIdStatus,
	): Effect.Effect<boolean, NotFoundException>;

	reserveIdObjState(
		kind: Kind,
		id: ProvId,
		desiredState: InFlightIdStatus,
	): Effect.Effect<void, NotFoundException | NotReserveableException>;

	releaseIdObjStateOnSuccess(
		kind: Kind,
		id: ProvId,
	): Effect.Effect<ActionHappened, NotFoundException>;

	releaseIdObjStateOnFailure(
		kind: Kind,
		id: ProvId,
	): Effect.Effect<ActionHappened, NotFoundException>;

	gc(): void;
}
