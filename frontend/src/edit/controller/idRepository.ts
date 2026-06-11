import { createLogger } from "@/lib/logging";
import {
	isIdentifiableKind,
	type ExistableKindMap,
	type IdentifiableKindMap,
	type IDRepository,
	type IdStatus,
	type Kind,
	type IdentifiableKind,
	type ExistableKind,
	ProvId,
	ServEx,
	ServId,
	type InFlightIdStatus,
	isInFlight,
	exitStatus,
	ActionHappened,
	type GroundIdStatus,
	entryStatus,
} from "./types/idTypes";
import { NotFoundException, NotReserveableException } from "./types/errors";
import { Effect } from "effect";

const logger = createLogger("IdRepository");

/**
 * As the current data model stands, most objects have an underlying ID. In order to synchronize the IDs that appear on the frontend and backend without sacrificing client responsiveness, we need a way to bridge the gap between client-side IDs and server-side IDs. This repository serves as a central place to manage this mapping and the state of these IDs.
 *
 * The ID repository provides the following functionalities:
 *
 * Generating new provisional IDs for objects that are being created on the client side but have not yet been persisted to the server.
 * Binding provisional IDs to server IDs once the server responds with the created object.
 * Tracking the existence of objects that may not have a server ID but are known to exist on the server.
 * Managing the state of IDs to prevent race conditions and ensure that operations on objects are performed in a consistent manner.
 *
 * The way it does so is as follows:
 * - Each provisional ID is keyed using a combination of its kind (e.g., "labelGroup", "labelData", "chapterContent") and a unique identifier (e.g., "provisional-1", "provisional-2", etc.).
 * - For each provisional ID, we associate it with a server ID (possibly null if it has not yet been created on the server) and a status (see types.ts for the possible statuses and state transitions).
 * - Any given provisional ID can be reserved for a specific state transition (e.g., from "pending" to "creating", from "clean" to "updating", etc.) if it is currently in the appropriate state and has the appropriate server ID existence status.
 * - Once an ID is reserved for a state transition, it cannot be reserved for another transition until it is released. The exception to this is the "locked" state, which can be reserved multiple times and only transitions back to "clean" once all locks are released.
 * - The repository provides methods to release reserved states on both success and failure, which will transition the ID to the appropriate next state based on the outcome of the operation.
 *
 * By centralizing this logic in a repository, we can ensure that all components that need to interact with IDs do so in a consistent manner, reducing the likelihood of bugs and race conditions related to ID management.
 */

type ServIdStatus = { serverId: ServId | null; status: IdStatus; lockCount: number };
type ServExistsStatus = { serverExists: ServEx | null; status: IdStatus; lockCount: number };

export function buildIdRepository(): IDRepository {
	let counterRef = 0;
	const identifiableKindMap: IdentifiableKindMap = {
		labelGroup: new Map<ProvId, ServIdStatus>(),
		labelData: new Map<ProvId, ServIdStatus>(),
		chapterContent: new Map<ProvId, ServIdStatus>(),
		chapter: new Map<ProvId, ServIdStatus>(),
	};

	const existableKindMap: ExistableKindMap = {
		label: new Map<ProvId, ServExistsStatus>(),
	};

	const newId = (kind: Kind): ProvId => {
		if (isIdentifiableKind(kind)) {
			const id = ProvId(`provisional-${counterRef++}`);
			identifiableKindMap[kind].set(id, {
				serverId: null,
				status: "pending",
				lockCount: 0,
			});
			return id;
		} else {
			const id = ProvId(`provisional-${counterRef++}`);
			existableKindMap[kind].set(id, {
				serverExists: null,
				status: "pending",
				lockCount: 0,
			});
			return id;
		}
	};

	const newIdAndBindId = (kind: IdentifiableKind, serverId: ServId): ProvId => {
		const id = ProvId(`provisional-${counterRef++}`);
		identifiableKindMap[kind].set(id, {
			serverId,
			status: "clean",
			lockCount: 0,
		});
		return id;
	};

	const newIdAndBindExists = (kind: ExistableKind): ProvId => {
		const id = ProvId(`provisional-${counterRef++}`);
		existableKindMap[kind].set(id, {
			serverExists: ServEx(true),
			status: "clean",
			lockCount: 0,
		});
		return id;
	};

	const getServerId = (kind: IdentifiableKind, provisionalId: ProvId) => {
		const entry = identifiableKindMap[kind].get(provisionalId);
		if (!entry) {
			return Effect.fail(new NotFoundException());
		}
		return Effect.succeed(entry.serverId);
	};

	const getServerExists = (kind: ExistableKind, provisionalId: ProvId) => {
		const entry = existableKindMap[kind].get(provisionalId);
		if (!entry) {
			return Effect.fail(new NotFoundException());
		}
		return Effect.succeed(entry.serverExists);
	};

	const bindServerId = (kind: IdentifiableKind, provisionalId: ProvId, serverId: ServId) => {
		const entry = identifiableKindMap[kind].get(provisionalId);
		if (!entry) {
			logger.error(`Provisional id ${provisionalId} not found for kind ${kind} in bindServerId`);
			return Effect.fail(new NotFoundException());
		}
		return Effect.sync(() => (entry.serverId = serverId));
	};

	const bindServerExists = (kind: ExistableKind, provisionalId: ProvId) => {
		const entry = existableKindMap[kind].get(provisionalId);
		if (!entry) {
			logger.error(
				`Provisional id ${provisionalId} not found for kind ${kind} in bindServerExists`,
			);
			return Effect.fail(new NotFoundException());
		}
		return Effect.sync(() => (entry.serverExists = ServEx(true)));
	};

	const idObjState = (kind: Kind, id: ProvId): Effect.Effect<IdStatus, NotFoundException> => {
		if (isIdentifiableKind(kind)) {
			const entry = identifiableKindMap[kind].get(id);
			if (!entry) {
				logger.error(`Provisional id ${id} not found for kind ${kind} in idObjState`);
				return Effect.fail(new NotFoundException());
			}
			return Effect.succeed(entry.status);
		} else {
			const entry = existableKindMap[kind].get(id);
			if (!entry) {
				logger.error(`Provisional id ${id} not found for kind ${kind} in idObjState`);
				return Effect.fail(new NotFoundException());
			}
			return Effect.succeed(entry.status);
		}
	};

	const isReserveable = (kind: Kind, id: ProvId, desiredState: InFlightIdStatus) =>
		Effect.gen(function* () {
			const currentState = yield* idObjState(kind, id);
			const serverState = isIdentifiableKind(kind)
				? identifiableKindMap[kind].get(id)?.serverId
				: existableKindMap[kind].get(id)?.serverExists;
			if (desiredState === "creating") {
				return currentState === "pending" && serverState === null;
			} else if (desiredState === "updating" || desiredState === "idUpdating") {
				return currentState === "clean" && serverState !== null;
			} else if (desiredState == "locked") {
				return (currentState === "clean" || currentState === "locked") && serverState !== null;
			} else if (desiredState === "deleting") {
				return currentState === "clean" && serverState !== null;
			} else if (desiredState === "detaching") {
				return currentState === "clean" && serverState !== null;
			} else if (desiredState === "loading") {
				return currentState === "pending";
			} else if (desiredState === "killing") {
				return currentState === "pending";
			} else {
				return false;
			}
		});

	const reserveIdObjState = (kind: Kind, id: ProvId, desiredState: InFlightIdStatus) =>
		Effect.gen(function* () {
			const reserveable = yield* isReserveable(kind, id, desiredState);
			if (!reserveable) {
				yield* Effect.fail(new NotReserveableException());
			}
			const entry = isIdentifiableKind(kind)
				? identifiableKindMap[kind].get(id)!
				: existableKindMap[kind].get(id)!;
			entry.status = desiredState;
			if (desiredState === "locked") {
				entry.lockCount += 1;
			}
			return;
		});

	const releaseIdObjState =
		(post: (status: InFlightIdStatus) => GroundIdStatus) => (kind: Kind, id: ProvId) => {
			const entry = isIdentifiableKind(kind)
				? identifiableKindMap[kind].get(id)!
				: existableKindMap[kind].get(id)!;
			if (!entry) {
				return Effect.fail(new NotFoundException());
			}
			if (!isInFlight(entry.status)) {
				return Effect.succeed(ActionHappened(false));
			}
			if (entry.status === "locked") {
				entry.lockCount = Math.max(0, entry.lockCount - 1);
				if (entry.lockCount >= 1) {
					return Effect.succeed(ActionHappened(true));
				}
			}
			entry.status = post(entry.status);
			return Effect.succeed(ActionHappened(true));
		};

	const releaseIdObjStateOnSuccess = releaseIdObjState(exitStatus);
	const releaseIdObjStateOnFailure = releaseIdObjState(entryStatus);

	const gc = () => {
		identifiableKindMap.labelGroup.forEach((value, key) => {
			if (value.status === "deleted" || value.status === "killed" || value.status === "detached") {
				identifiableKindMap.labelGroup.delete(key);
			}
		});
		identifiableKindMap.labelData.forEach((value, key) => {
			if (value.status === "deleted" || value.status === "killed" || value.status === "detached") {
				identifiableKindMap.labelData.delete(key);
			}
		});
		identifiableKindMap.chapterContent.forEach((value, key) => {
			if (value.status === "deleted" || value.status === "killed" || value.status === "detached") {
				identifiableKindMap.chapterContent.delete(key);
			}
		});
		existableKindMap.label.forEach((value, key) => {
			if (value.status === "deleted" || value.status === "killed" || value.status === "detached") {
				existableKindMap.label.delete(key);
			}
		});
	};

	return {
		newId,
		newIdAndBindId,
		newIdAndBindExists,
		getServerId,
		getServerExists,
		bindServerId,
		bindServerExists,
		idObjState,
		isReserveable,
		reserveIdObjState,
		releaseIdObjStateOnSuccess,
		releaseIdObjStateOnFailure,
		gc,
	};
}
