import { useRef } from "react";
import type { IDRepository, IdentifiableKindMap, ExistableKindMap, IdStatus, ServerExists, ServerId, ProvisionalId, Kind, IdentifiableKind, ExistableKind } from "./types";
import { isIdentifiableKind, isInFlight, entryStatus, exitStatus } from "./types";


export function useIdRepository() : IDRepository {
    const counter = useRef(0)
    const identifiableKindMap = useRef<IdentifiableKindMap>({
        labelGroup : new Map<ProvisionalId, { serverId : ServerId | null, status : IdStatus }>(),
        labelData : new Map<ProvisionalId, { serverId : ServerId | null, status : IdStatus }>(),
        chapterContent : new Map<ProvisionalId, { serverId : ServerId | null, status : IdStatus }>(),
    })

    const existableKindMap = useRef<ExistableKindMap>({
        label : new Map<ProvisionalId, { serverExists : ServerExists | null, status : IdStatus }>(),
    })

    return {
        newId(kind : Kind) : ProvisionalId {
            if (isIdentifiableKind(kind)) {
                const id = `provisional-${counter.current++}`
                identifiableKindMap.current[kind].set(id, { serverId: null, status: "pending" })
                return id
            }
            else {
                const id = `provisional-${counter.current++}`
                existableKindMap.current[kind].set(id, { serverExists: null, status: "pending" })
                return id
            }
        },

        newIdAndBindId(kind : IdentifiableKind, serverId : string) : ProvisionalId {
            const id = `provisional-${counter.current++}`
            identifiableKindMap.current[kind].set(id, { serverId, status: "clean" })
            return id
        },

        newIdAndBindExists(kind : ExistableKind) : ProvisionalId {
            const id = `provisional-${counter.current++}`
            existableKindMap.current[kind].set(id, { serverExists: true, status: "clean" })
            return id
        },

        getServerId(kind : IdentifiableKind, provisionalId : ProvisionalId) : ServerId | null {
            const entry = identifiableKindMap.current[kind].get(provisionalId)
            if (!entry) throw new Error(`Provisional id ${provisionalId} not found for kind ${kind}`)
            return entry.serverId
        },

        getServerExists(kind : ExistableKind, provisionalId : ProvisionalId) : ServerExists | null {
            const entry = existableKindMap.current[kind].get(provisionalId)
            if (!entry) throw new Error(`Provisional id ${provisionalId} not found for kind ${kind}`)
            return entry.serverExists
        },

        bindServerId(kind : IdentifiableKind, provisionalId : ProvisionalId, serverId : ServerId) : void {
            const entry = identifiableKindMap.current[kind].get(provisionalId)
            if (!entry) throw new Error(`Provisional id ${provisionalId} not found for kind ${kind}`)
            entry.serverId = serverId
        },

        bindServerExists(kind : ExistableKind, provisionalId : ProvisionalId) : void {
            const entry = existableKindMap.current[kind].get(provisionalId)
            if (!entry) throw new Error(`Provisional id ${provisionalId} not found for kind ${kind}`)
            entry.serverExists = true
        },

        idObjState(kind : Kind, id : string) : IdStatus {
            if (isIdentifiableKind(kind)) {
                const entry = identifiableKindMap.current[kind].get(id)
                if (!entry) throw new Error(`Provisional id ${id} not found for kind ${kind}`)
                return entry.status
            }
            else {
                const entry = existableKindMap.current[kind].get(id)
                if (!entry) throw new Error(`Provisional id ${id} not found for kind ${kind}`)
                return entry.status
            }
        },

        isReserveable(kind : Kind, id : ProvisionalId, desiredState : IdStatus) : boolean {
            const currentState = this.idObjState(kind, id)
            const serverState = isIdentifiableKind(kind) ? identifiableKindMap.current[kind].get(id)?.serverId : existableKindMap.current[kind].get(id)?.serverExists
            if (desiredState === "creating") {
                return currentState === "pending" && serverState === null
            }
            else if (desiredState === "updating" || desiredState === "idUpdating") {
                return currentState === "clean" && serverState !== null
            }
            else if (desiredState == "locked") {
                return (currentState === "clean" || currentState === "locked") && serverState !== null
            }
            else if (desiredState === "deleting") {
                return currentState === "clean" && serverState !== null
            }
            else {
                return false
            }
        },

        reserveIdObjState(kind : Kind, id : ProvisionalId, desiredState : IdStatus) : boolean {
            if (!this.isReserveable(kind, id, desiredState)) {
                return false
            }
            const entry = isIdentifiableKind(kind) ? identifiableKindMap.current[kind].get(id)! : existableKindMap.current[kind].get(id)!
            entry.status = desiredState
            return true
        },

        releaseIdObjStateOnSuccess(kind : Kind, id : ProvisionalId) : void {
            const entry = isIdentifiableKind(kind) ? identifiableKindMap.current[kind].get(id)! : existableKindMap.current[kind].get(id)!
            if (!entry || !isInFlight(entry.status)) {
                return
            }
            entry.status = exitStatus(entry.status)
        },

        releaseIdObjStateOnFailure(kind : Kind, id : ProvisionalId) : void {
            const entry = isIdentifiableKind(kind) ? identifiableKindMap.current[kind].get(id) : existableKindMap.current[kind].get(id)
            if (!entry || !isInFlight(entry.status)) {
                return
            }
            entry.status = entryStatus(entry.status)
        }
    }
}
