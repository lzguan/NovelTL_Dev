import client from "./client";
import { type LabelGroup, type CreateLabelGroup } from "../types/label";

// --- Response mappers (API snake_case → frontend camelCase) ---

/* eslint-disable @typescript-eslint/no-explicit-any */

const mapLabelGroup = (data: any): LabelGroup => ({
    labelGroupId: data.label_group_id,
    labelGroupName: data.label_group_name,
    novelId: data.novel_id,
})

/* eslint-enable @typescript-eslint/no-explicit-any */

// --- Request mappers (frontend camelCase → API snake_case) ---

const mapCreateLabelGroupRequest = (data: CreateLabelGroup) => ({
    label_group_name: data.labelGroupName,
    novel_id: data.novelId,
})

// --- API functions ---

export const getLabelGroupsByNovel = async (novelId : number) : Promise<LabelGroup[]> => {
    const result = await client.get(`/label-groups`, {
        params: {
            "novel-id": novelId
        }
    })
    return result.data.map(mapLabelGroup)
}

export const createLabelGroup = async (request : CreateLabelGroup) : Promise<LabelGroup> => {
    const result = await client.post('/label-groups', mapCreateLabelGroupRequest(request))
    return mapLabelGroup(result.data)
}

export const getLabelGroupById = async (labelGroupId : number) : Promise<LabelGroup> => {
    const result = await client.get(`/label-groups/${labelGroupId}`)
    return mapLabelGroup(result.data)
}