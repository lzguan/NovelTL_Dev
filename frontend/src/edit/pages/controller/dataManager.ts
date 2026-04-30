import { useRef } from "react"
import type { TextOp } from "@/client"
import type { DataEntry, LabelOp, DataManager, IDRepository, ProvisionalId, RequestEvent, ProvisionalLabelGroup, Kind, IdStatus, Signal } from "./types"
import { createLabelDataLabelGroupsLabelGroupIdLabelDatasPost, createLabelGroupLabelGroupsPost, updateChapterContentChaptersChapterIdContentPatch, updateLabelDataStreamLabelDatasLabelDataIdPatch } from "@/client"

export function useDataManager(ents : DataEntry[], idRepo : IDRepository, novelId : string, chapterId : string, initialChapterContentId : ProvisionalId, initialText : string) : DataManager {
    const entriesRef = useRef<DataEntry[]>(ents)
    const textRef = useRef<string>(initialText)
    const chapterContentIdRef = useRef<ProvisionalId>(initialChapterContentId)
    const labelOpQueueRef = useRef<Map<ProvisionalId, { labelId : ProvisionalId, op : LabelOp }[]>>(new Map())
    const textOpQueueRef = useRef<{ op : TextOp, labelDataIds : ProvisionalId[], labelIds : ProvisionalId[] }[]>([])

    const ensureNoPendingTextOps = () => {
        if (textOpQueueRef.current.length > 0) {
            throw new Error("Cannot mutate labels while text operations are pending flush.")
        }
    }

    const ensureNoPendingLabelOps = () => {
        const hasPendingLabelOps = Array.from(labelOpQueueRef.current.values()).some((ops) => ops.length > 0)
        if (hasPendingLabelOps) {
            throw new Error("Cannot mutate text while label operations are pending flush.")
        }
    }

    const queueLabelOp = (labelGroupId : ProvisionalId, labelId : ProvisionalId, op : LabelOp) => {
        if (!labelOpQueueRef.current.has(labelGroupId)) {
            labelOpQueueRef.current.set(labelGroupId, [])
        }
        labelOpQueueRef.current.get(labelGroupId)!.push({ labelId, op })
    }

    const getMatchingLabelIndex = (entry : DataEntry, startPos : number, endPos : number) => {
        return entry.labels.findIndex((label) => label.labelStart === startPos && label.labelEnd === endPos)
    }

    const addLabelGroup = (labelGroupName : string) : RequestEvent[] => {
        const provisionalGroupId = idRepo.newId("labelGroup")
        const provisionalDataId = idRepo.newId("labelData")
        const newLabelGroup : ProvisionalLabelGroup = {
            labelGroupId: provisionalGroupId,
            labelGroupName: labelGroupName,
            novelId: novelId,
            provisional: true
        }
        const newEntries = [...entriesRef.current]
        newEntries.unshift({
            labelGroup: newLabelGroup,
            labelData: { labelDataId: provisionalDataId, labelGroupId: provisionalGroupId, chapterContentId: chapterContentIdRef.current, provisional: true },
            labels: [],
            role: "owner",
            visible: true,
        })
        entriesRef.current = newEntries

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
                    idRepo.bindServerId("labelGroup", provisionalGroupId, resp.data.labelGroupId)
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
                    idRepo.bindServerId("labelData", provisionalDataId, resp.data.labelDataId)
                    return null
                },
                reserveList: [ { id : provisionalDataId, kind: "labelData", desiredState: "creating" }, { id : provisionalGroupId, kind: "labelGroup", desiredState: "locked" }, { id : chapterContentIdRef.current, kind : "chapterContent", desiredState : "locked"} ],
            }
        ]
    }

    const addLabel = (labelGroupId : string, labelDataId : string, startPos : number, endPos : number, word : string, entityGroup? : string, score? : number, dirty? : boolean) : void => {
        ensureNoPendingTextOps()
        if (startPos < 0 || startPos >= endPos || endPos > textRef.current.length) {
            throw new Error("Label bounds are out of range")
        }
        if (word.length !== endPos - startPos) {
            throw new Error("Label word length must match label bounds")
        }
        if (textRef.current.slice(startPos, endPos) !== word) {
            throw new Error("Label word must match the current chapter text")
        }
        const provisionalLabelId = idRepo.newId("label")
        const entriesCopy = [...entriesRef.current]
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
            labelDirty: dirty ?? true,
            labelEntityGroup: entityGroup ?? null,
            labelScore: score ?? 1.0,
        })
        entriesCopy[entryIndex].labels.sort((left, right) => left.labelStart - right.labelStart)
        queueLabelOp(labelGroupId, provisionalLabelId, {
            op: "add",
            startPos: startPos,
            endPos: endPos,
            word: word,
            entityGroup: entityGroup ?? null,
            score: score ?? 1.0,
            dirty: dirty ?? true,
        })
        entriesRef.current = entriesCopy
    }

    const deleteLabel = (labelGroupId : string, labelDataId : string, startPos : number, endPos : number) : void => {
        ensureNoPendingTextOps()
        const entriesCopy = [...entriesRef.current]
        const entryIndex = entriesCopy.findIndex((entry) => entry.labelGroup.labelGroupId === labelGroupId)
        if (entryIndex === -1) {
            throw new Error(`Label group with id ${labelGroupId} not found`)
        }
        const entry = entriesCopy[entryIndex]
        const labelIndex = getMatchingLabelIndex(entry, startPos, endPos)
        if (labelIndex === -1) {
            throw new Error(`Label [${startPos}, ${endPos}) not found in label group ${labelGroupId}`)
        }
        const label = entry.labels[labelIndex]
        if (label.labelDataId !== labelDataId) {
            throw new Error(`Label does not belong to label data ${labelDataId}`)
        }

        entriesCopy[entryIndex] = {
            ...entry,
            labels: entry.labels.filter((_, idx) => idx !== labelIndex),
        }
        queueLabelOp(labelGroupId, label.labelId, {
            op: "delete",
            startPos: label.labelStart,
            endPos: label.labelEnd,
            word: label.labelWord,
        })
        entriesRef.current = entriesCopy
    }

    const updateLabel = (
        labelGroupId : string,
        labelDataId : string,
        startPos : number,
        endPos : number,
        newStartPos? : number | null,
        newEndPos? : number | null,
        newWord? : string | null,
        entityGroup? : string,
        score? : number,
        dirty? : boolean,
    ) : void => {
        ensureNoPendingTextOps()
        const entriesCopy = [...entriesRef.current]
        const entryIndex = entriesCopy.findIndex((entry) => entry.labelGroup.labelGroupId === labelGroupId)
        if (entryIndex === -1) {
            throw new Error(`Label group with id ${labelGroupId} not found`)
        }
        const entry = entriesCopy[entryIndex]
        const labelIndex = getMatchingLabelIndex(entry, startPos, endPos)
        if (labelIndex === -1) {
            throw new Error(`Label [${startPos}, ${endPos}) not found in label group ${labelGroupId}`)
        }
        const currentLabel = entry.labels[labelIndex]
        if (currentLabel.labelDataId !== labelDataId) {
            throw new Error(`Label does not belong to label data ${labelDataId}`)
        }

        const nextStart = newStartPos ?? currentLabel.labelStart
        const nextEnd = newEndPos ?? currentLabel.labelEnd
        const boundsChanged = newStartPos != null || newEndPos != null
        if (!boundsChanged && newWord != null) {
            throw new Error("Cannot set a new label word without changing label bounds")
        }
        const nextWord = newWord ?? (boundsChanged ? textRef.current.slice(nextStart, nextEnd) : currentLabel.labelWord)
        if (nextStart >= nextEnd) {
            throw new Error("Updated label must have start < end")
        }
        if (nextStart < 0 || nextEnd > textRef.current.length) {
            throw new Error("Updated label bounds are out of range")
        }
        if (nextWord.length !== nextEnd - nextStart) {
            throw new Error("Updated label word length must match updated bounds")
        }
        if (textRef.current.slice(nextStart, nextEnd) !== nextWord) {
            throw new Error("Updated label word must match the current chapter text")
        }
        const overlapsExisting = entry.labels.some((label, idx) => {
            if (idx === labelIndex) {
                return false
            }
            return Math.max(label.labelStart, nextStart) < Math.min(label.labelEnd, nextEnd)
        })
        if (overlapsExisting) {
            throw new Error("Updated label overlaps with existing label")
        }

        entriesCopy[entryIndex] = {
            ...entry,
            labels: entry.labels.map((label, idx) => {
                if (idx !== labelIndex) {
                    return label
                }
                return {
                    ...label,
                    labelStart: nextStart,
                    labelEnd: nextEnd,
                    labelWord: nextWord,
                    labelEntityGroup: entityGroup ?? label.labelEntityGroup,
                    labelScore: score ?? label.labelScore,
                    labelDirty: dirty ?? label.labelDirty,
                }
            }).sort((left, right) => left.labelStart - right.labelStart),
        }

        queueLabelOp(labelGroupId, currentLabel.labelId, {
            op: "update",
            startPos: currentLabel.labelStart,
            endPos: currentLabel.labelEnd,
            word: currentLabel.labelWord,
            newStartPos: nextStart !== currentLabel.labelStart ? nextStart : undefined,
            newEndPos: nextEnd !== currentLabel.labelEnd ? nextEnd : undefined,
            newWord: nextWord !== currentLabel.labelWord ? nextWord : undefined,
            entityGroup: entityGroup ?? undefined,
            score: score ?? undefined,
            dirty: dirty ?? undefined,
        })
        entriesRef.current = entriesCopy
    }

    const flushLabelOps = () : RequestEvent[] => {
        const queuedOps = Array.from(labelOpQueueRef.current.entries()).filter(([, ops]) => ops.length > 0)
        labelOpQueueRef.current = new Map()
        return queuedOps.map(([labelGroupId, queuedLabelOps]) => {
            const entry = entriesRef.current.find((candidate) => candidate.labelGroup.labelGroupId === labelGroupId)
            if (!entry) {
                throw new Error(`Label group with id ${labelGroupId} not found while flushing label ops`)
            }
            const currentLabelIds = new Set(entry.labels.map((label) => label.labelId))
            const reserveList : { id : ProvisionalId, kind : Kind, desiredState : IdStatus }[] = [
                { id: entry.labelData.labelDataId, kind: "labelData", desiredState: "updating" },
                { id: chapterContentIdRef.current, kind: "chapterContent", desiredState: "locked" },
            ]
            const reservedLabelIds = new Set<ProvisionalId>()
            for (const { labelId } of queuedLabelOps) {
                if (reservedLabelIds.has(labelId)) {
                    continue
                }
                reservedLabelIds.add(labelId)
                const currentState = idRepo.idObjState("label", labelId)
                const labelStillExists = currentLabelIds.has(labelId)
                if (currentState === "pending" && !labelStillExists) {
                    continue
                }
                if (currentState === "pending") {
                    reserveList.push({ id: labelId, kind: "label", desiredState: "creating" })
                }
                else if (labelStillExists) {
                    reserveList.push({ id: labelId, kind: "label", desiredState: "updating" })
                }
                else {
                    reserveList.push({ id: labelId, kind: "label", desiredState: "deleting" })
                }
            }
            return {
                variant: "labelOp",
                reserveList,
                callback: async () => {
                    await updateLabelDataStreamLabelDatasLabelDataIdPatch({
                        path: {
                            labelDataId: idRepo.getServerId("labelData", entry.labelData.labelDataId)!,
                        },
                        body: {
                            ops: queuedLabelOps.map(({ op }) => op),
                        },
                    })
                    for (const { labelId, op } of queuedLabelOps) {
                        if (op.op === "add" && currentLabelIds.has(labelId)) {
                            idRepo.bindServerExists("label", labelId)
                        }
                    }
                    return null
                },
            }
        })
    }

    const insertTextAt = (pos : number, insertedText : string) : void => {
        ensureNoPendingLabelOps()
        const currentText = textRef.current
        if (pos < 0 || pos > currentText.length) {
            throw new Error("Insert position is out of bounds")
        }
        if (insertedText.length === 0) {
            return
        }
        const affectedLabelDataIds = entriesRef.current.map((entry) => entry.labelData.labelDataId)
        const affectedLabelIds = entriesRef.current.flatMap((entry) => entry.labels.map((label) => label.labelId))
        const delta = insertedText.length
        const nextEntries = entriesRef.current.map((entry) => {
            const nextLabels = entry.labels
                .filter((label) => label.labelEnd <= pos || label.labelStart >= pos)
                .map((label) => {
                    if (label.labelStart >= pos) {
                        return {
                            ...label,
                            labelStart: label.labelStart + delta,
                            labelEnd: label.labelEnd + delta,
                        }
                    }
                    return label
                })
                .sort((left, right) => left.labelStart - right.labelStart)
            return {
                ...entry,
                labels: nextLabels,
            }
        })
        entriesRef.current = nextEntries
        textRef.current = currentText.slice(0, pos) + insertedText + currentText.slice(pos)
        textOpQueueRef.current.push({
            op: {
                op: "insert",
                start: pos,
                text: insertedText,
            },
            labelDataIds: affectedLabelDataIds,
            labelIds: affectedLabelIds,
        })
    }

    const deleteTextAt = (startPos : number, endPos : number) : void => {
        ensureNoPendingLabelOps()
        const currentText = textRef.current
        if (startPos < 0 || startPos > currentText.length || endPos < startPos || endPos > currentText.length) {
            throw new Error("Delete text range is out of bounds")
        }
        const deletedText = currentText.slice(startPos, endPos)
        if (deletedText.length === 0) {
            return
        }
        const affectedLabelDataIds = entriesRef.current.map((entry) => entry.labelData.labelDataId)
        const affectedLabelIds = entriesRef.current.flatMap((entry) => entry.labels.map((label) => label.labelId))
        const delta = deletedText.length
        const nextEntries = entriesRef.current.map((entry) => {
            const nextLabels = entry.labels
                .filter((label) => label.labelEnd <= startPos || label.labelStart >= endPos)
                .map((label) => {
                    if (label.labelStart >= endPos) {
                        return {
                            ...label,
                            labelStart: label.labelStart - delta,
                            labelEnd: label.labelEnd - delta,
                        }
                    }
                    return label
                })
                .sort((left, right) => left.labelStart - right.labelStart)
            return {
                ...entry,
                labels: nextLabels,
            }
        })
        entriesRef.current = nextEntries
        textRef.current = currentText.slice(0, startPos) + currentText.slice(endPos)
        textOpQueueRef.current.push({
            op: {
                op: "delete",
                start: startPos,
                text: deletedText,
            },
            labelDataIds: affectedLabelDataIds,
            labelIds: affectedLabelIds,
        })
    }

    const flushTextOps = () : RequestEvent[] => {
        if (textOpQueueRef.current.length === 0) {
            return []
        }
        const queuedTextOps = [...textOpQueueRef.current]
        textOpQueueRef.current = []
        const currentChapterContentId = chapterContentIdRef.current
        const reserveLabelDataIds = Array.from(new Set(queuedTextOps.flatMap(({ labelDataIds }) => labelDataIds)))
        const reserveLabelIds = Array.from(new Set(queuedTextOps.flatMap(({ labelIds }) => labelIds)))
        return [
            {
                variant: "textOp",
                reserveList: [
                    { id: currentChapterContentId, kind: "chapterContent", desiredState: "updating" },
                    ...reserveLabelDataIds.map((labelDataId) => ({ id: labelDataId, kind: "labelData" as const, desiredState: "idUpdating" as const })),
                    ...reserveLabelIds.map((labelId) => ({ id: labelId, kind: "label" as const, desiredState: "updating" as const })),
                ],
                callback: async () => {
                    const resp = await updateChapterContentChaptersChapterIdContentPatch({
                        path: {
                            chapterId,
                        },
                        body: {
                            chapterContentId: idRepo.getServerId("chapterContent", currentChapterContentId)!,
                            textOps: queuedTextOps.map(({ op }) => op),
                        },
                    })
                    if (!resp.data) {
                        throw new Error("Failed to modify chapter content")
                    }
                    idRepo.bindServerId("chapterContent", currentChapterContentId, resp.data.chapterContentId)
                    for (const entry of entriesRef.current) {
                        const oldServerLabelDataId = idRepo.getServerId("labelData", entry.labelData.labelDataId)
                        if (oldServerLabelDataId === null) {
                            throw new Error(`Label data ${entry.labelData.labelDataId} is not bound to a server id`)
                        }
                        const nextServerLabelDataId = resp.data.labelDataIdMap[oldServerLabelDataId]
                        if (!nextServerLabelDataId) {
                            throw new Error(`Missing label data remap for server label data id ${oldServerLabelDataId}`)
                        }
                        idRepo.bindServerId("labelData", entry.labelData.labelDataId, nextServerLabelDataId)
                    }
                    return null
                },
            },
        ]
    }

    const handleSignal = (_signal : Signal) => {
        console.log("Received signal in data manager:", _signal)
        return
    }

    

    return {
        addLabel: addLabel,
        addLabelGroup: addLabelGroup,
        deleteLabel,
        updateLabel,
        flushLabelOps,
        insertTextAt,
        deleteTextAt,
        flushTextOps,
        handleSignal,
    }
}