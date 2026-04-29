import { createLabelDataLabelGroupsLabelGroupIdLabelDatasPost, createLabelGroupLabelGroupsPost, type AddLabelOp, type DeleteLabelOp, type EditChapterData, type Label, type LabelData, type LabelGroup, type Role, type TextOp, type UpdateLabelOp } from "@/client";
import type { ColorStyle, ProductStyle } from "@/components/labeled-text-lib/builtin/reducers";
import type { SegmentManager } from "@/components/labeled-text-lib/core/segmentManager";
import type { StyledLabel } from "@/components/labeled-text-lib/core/types";
import { useRef, useState } from "react";

type MyStyle = ProductStyle<[ColorStyle, { visible: boolean, mutable: boolean }]>

type LabelOp = AddLabelOp | DeleteLabelOp | UpdateLabelOp


/**
 * Event types that (might) affect the text/labels or the UI state of the editor, which need to be processed by the controller.
 */
type UserEvent = { _type : "textOp", op : TextOp } // text op 
| { eventType : "labelOp", op : LabelOp, labelGroupId : string } // label op
| { eventType : "addLabelGroup", labelGroupName : string } // add a new label group
| { eventType : "switchMode", mode : "edit" | "label" | "view" } // switch between text editing mode, label editing mode and view mode (no editing)
| { eventType : "switchLabelGroup", labelGroupId : string | null } // place focus on a specific label group
| { eventType : "hoverPos", pos : number | null } // hover on a specific position in text, or null to clear hover
| { eventType : "clickPos", pos : number | null } // click on a specific position in text, or null to clear click

type Signal = null | { signalType : "changeLabelGroupId", oldId : string, newId : string }

type RequestVariant = "addLabelGroup" | "textOp" | "labelOp"
type RequestEvent = {
    callback : () => Promise<Signal>
    reserveList : { id : ProvisionalId, kind : Kind, desiredState : IdStatus }[]
    variant : RequestVariant
}

type ProvisionalLabelGroup = LabelGroup & { provisional: true }
type ProvisionalLabelData = LabelData & { provisional: true }
type ProvisionalLabel = Label & { provisional: true }


type DataEntry = {
    labelGroup : ProvisionalLabelGroup
    labelData : ProvisionalLabelData
    labels : ProvisionalLabel[] // sorted by start position
    role : Role
    visible : boolean
}

/**
 * State transitions for id objects in the repository:
 * pending -> creating
 * creating -> clean
 * clean -> updating
 * clean -> idUpdating
 * clean -> deleting
 * updating -> clean
 * idUpdating -> clean
 * deleting -> deleted
 * 
 * creating, updating, idUpdating, deleting states effectively lock this resource
 * not enforced yet, adhere to this convention when implementing the controller to ensure correctness
 */

type InFlightIdStatus = "creating" | "updating" | "idUpdating" | "deleting" | "locked"
type GroundIdStatus = "pending" | "clean" | "deleted"

type IdStatus = InFlightIdStatus | GroundIdStatus

function entryStatus(status : InFlightIdStatus): GroundIdStatus {
    if (status === "creating") {
        return "pending"
    }
    return "clean"
}

function exitStatus(status : InFlightIdStatus) : GroundIdStatus {
    if (status === "creating" || status === "updating" || status === "idUpdating" || status === "locked") {
        return "clean"
    }
    return "deleted"
}

function isInFlight(status : IdStatus) : status is InFlightIdStatus {
    return status === "creating" || status === "updating" || status === "idUpdating" || status === "deleting" || status === "locked"
}

type IdentifiableKind = "labelGroup" | "labelData" | "chapterContent"
type ExistableKind = "label"
type Kind = IdentifiableKind | ExistableKind

type IdentifiableKindMap = { [K in IdentifiableKind] : Map<ProvisionalId, { serverId : ServerId | null, status : IdStatus }> } 
type ExistableKindMap = { [K in ExistableKind] : Map<ProvisionalId, { serverExists : ServerExists | null, status : IdStatus }> }

function isIdentifiableKind(kind : Kind) : kind is IdentifiableKind {
    return kind === "labelGroup" || kind === "labelData" || kind === "chapterContent"
}


type ProvisionalId = string
type ServerId = string
type ServerExists = true

/**
 * Used for managing existence of ids, not state
 */
interface IDRepository {
    /**
     * Create a new id and manage it in the repository. 
     */
    newId(kind : Kind) : ProvisionalId

    /**
     * Create a new id, bind it to the given server id, and manage it in the repository. 
     */
    newIdAndBindId(kind : IdentifiableKind, serverId : ServerId) : ProvisionalId
    newIdAndBindExists(kind : ExistableKind) : ProvisionalId

    /**
     * Get the server id corresponding to a provisional id. If server id has not been bound yet, return null. 
     */
    getServerId(kind : IdentifiableKind, provisionalId : ProvisionalId) : ServerId | null
    getServerExists(kind : ExistableKind, provisionalId : ProvisionalId) : ServerExists | null

    /**
     * Bind a provisional id to a server id, so that the controller can update the corresponding entry with the new server id when it receives the signal from the request event.
     */
    bindServerId(kind : IdentifiableKind, provisionalId : ProvisionalId, serverId : ServerId) : void
    bindServerExists(kind : ExistableKind, provisionalId : ProvisionalId) : void

    idObjState(kind : Kind, id : ProvisionalId) : IdStatus

    updateServerId(kind : IdentifiableKind, provisionalId : string, newServerId : string): void

    isReserveable(kind : Kind, id : ProvisionalId, desiredState : IdStatus) : boolean

    reserveIdObjState(kind : Kind, id : ProvisionalId, desiredState : IdStatus) : boolean

    releaseIdObjStateOnSuccess(kind : Kind, id : ProvisionalId) : void

    releaseIdObjStateOnFailure(kind : Kind, id : ProvisionalId) : void
}

function useIdRepository() : IDRepository {
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

        updateServerId(kind : IdentifiableKind, provisionalId : string, newServerId : string): void {
            const entry = identifiableKindMap.current[kind].get(provisionalId)
            if (!entry) throw new Error(`Provisional id ${provisionalId} not found for kind ${kind}`)
            entry.serverId = newServerId
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

type DataManager = {
    text : string
    entries : DataEntry[]
    chapterContentId : string | null

    addLabelGroup : (labelGroupName : string) => RequestEvent[]
    addLabel : (labelGroupId : string, labelDataId : string, startPos : number, endPos : number, word : string, entityGroup? : string, score? : number, dirty? : boolean) => void
    deleteLabel : (labelGroupId : string, labelDataId : string, startPos : number, endPos : number) => void
    updateLabel : (labelGroupId : string, labelDataId : string, startPos : number, endPos : number, newStartPos? : number | null, newEndPos? : number | null, newWord? : string | null,  entityGroup? : string, score? : number, dirty? : boolean) => void
    flushLabelOps : () => RequestEvent[]
    insertTextAt : (pos : number, text : string) => void
    deleteTextAt : (startPos : number, endPos : number) => void
    flushTextOps : () => RequestEvent[]

    handleSignal : (signal : Signal) => void
}

type RequestManager = {
    isQueueEmpty : boolean
    error : unknown | null
    enqueueRequest : (request : RequestEvent) => void

    handleSignal : (signal : Signal) => void
}

export interface Controller {
    handleEvent : (event : UserEvent) => void
    uiManager : SegmentManager<MyStyle, StyledLabel<MyStyle>>
    requestManager : RequestManager
    dataManager : DataManager
    idRepository : IDRepository
    error : unknown

    handleSignal : (signal : Signal) => void
}

function useDataManager(ents : DataEntry[], idRepo : IDRepository, novelId : string, initialChapterContentId : ProvisionalId) : DataManager {
    const [entries, setEntries] = useState<DataEntry[]>(ents)
    const chapterContentIdRef = useRef<ProvisionalId>(initialChapterContentId)
    const labelOpQueueRef = useRef<Map<ProvisionalId, LabelOp[]>>(new Map())

    const addLabelGroup = (labelGroupName : string) : RequestEvent[] => {
        const provisionalGroupId = idRepo.newId("labelGroup")
        const provisionalDataId = idRepo.newId("labelData")
        const newLabelGroup : ProvisionalLabelGroup = {
            labelGroupId: provisionalGroupId,
            labelGroupName: labelGroupName,
            novelId: novelId,
            provisional: true
        }
        const newEntries = [...entries]
        newEntries.unshift({
            labelGroup: newLabelGroup,
            labelData: { labelDataId: provisionalDataId, labelGroupId: provisionalGroupId, chapterContentId: chapterContentIdRef.current, provisional: true },
            labels: [],
            role: "owner",
            visible: true,
        })
        setEntries(newEntries)

        return [
            {
                variant: "addLabelGroup",
                callback: async () => {
                    const resp = await createLabelGroupLabelGroupsPost({ 
                        body: {
                            novelId: novelId,
                            labelGroupName: labelGroupName,
                        }
                    })
                    if (!resp.data) {
                        throw new Error("Failed to create label group")
                    }
                    return null
                },
                reserveList: [ { id : provisionalGroupId, kind: "labelGroup", desiredState: "creating" } ],
            },
            {
                variant: "addLabelGroup",
                callback: async () => {
                    const resp = await createLabelDataLabelGroupsLabelGroupIdLabelDatasPost({
                        body: {
                            chapterContentId: idRepo.getServerId("chapterContent", chapterContentIdRef.current)!,
                        },
                        path: {
                            labelGroupId: idRepo.getServerId("labelGroup", provisionalGroupId)!
                        }
                    })
                    if (!resp.data) {
                        throw new Error("Failed to create label data")
                    }
                    return null
                },
                reserveList: [ { id : provisionalDataId, kind: "labelData", desiredState: "creating" }, { id : provisionalGroupId, kind: "labelGroup", desiredState: "locked" }, { id : chapterContentIdRef.current, kind : "chapterContent", desiredState : "locked"} ],
            }
        ]
    }

    const addLabel = (labelGroupId : string, labelDataId : string, startPos : number, endPos : number, word : string, entityGroup? : string, score? : number, dirty? : boolean) : void => {
        const provisionalLabelId = idRepo.newId("label")
        const entriesCopy = [...entries]
        const entryIndex = entriesCopy.findIndex(e => e.labelGroup.labelGroupId === labelGroupId)
        if (entryIndex === -1) {
            throw new Error(`Label group with id ${labelGroupId} not found`)
        }
        const entry = entriesCopy[entryIndex]
        if (entry.labels.some(l => Math.max(l.labelStart, startPos) < Math.min(l.labelEnd, endPos) )) { // if any label overlaps with [startPos, endPos)
            throw new Error("Label overlaps with existing label")
        } 

        entriesCopy[entryIndex].labels.push({
            labelId: provisionalLabelId,
            labelDataId: labelDataId,
            labelStart: startPos,
            labelEnd: endPos,
            labelWord: word,
            provisional: true,
            labelDirty: dirty || false,
            labelEntityGroup: entityGroup || null,
            labelScore: score || 1.0,
        })
        if (!labelOpQueueRef.current.has(labelGroupId)) {
            labelOpQueueRef.current.set(labelGroupId, [])
        }
        labelOpQueueRef.current.get(labelGroupId)!.push({
            op: "add",
            startPos: startPos,
            endPos: endPos,
            word: word,
            entityGroup: entityGroup || null,
            score: score || 1.0,
            dirty: dirty || false,
        })
        setEntries(entriesCopy)
    }

    return {
        addLabel: addLabel,
        addLabelGroup: addLabelGroup,
    }
}