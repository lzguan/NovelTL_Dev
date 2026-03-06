import client from './client'
import { type Language } from '../types/language'

// --- Response mapper (API snake_case → frontend camelCase) ---

/* eslint-disable @typescript-eslint/no-explicit-any */

const mapLanguage = (data: any): Language => ({
    languageCode: data.language_code,
    languageName: data.language_name,
})

/* eslint-enable @typescript-eslint/no-explicit-any */

// --- API functions ---

export const getLanguages = async () : Promise<Language[]> => {
    const result = await client.get('/languages')
    return result.data.map(mapLanguage)
}

export const getLanguageByCode = async (languageCode : string) : Promise<Language> => {
    const result = await client.get(`/languages/${languageCode}`)
    return mapLanguage(result.data)
}