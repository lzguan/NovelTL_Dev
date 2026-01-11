export const AppRoutes = {
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    VIEW: {
        NOVELS: '/view/novels',
        NOVEL_DETAILS: '/view/novels/:novel_id',
        // FIX: Match the pattern used in routeTo below
        CHAPTER: '/view/chapters/:chapter_id', 
    }
} as const;

export const routeTo = {
    view: {
        novel: (id: number) => `/view/novels/${id}`,
        chapter : (chapterId : number, revisionId? : number) => {
            // This matches the AppRoutes.VIEW.CHAPTER pattern
            const url = `/view/chapters/${chapterId}`
            if (typeof revisionId === "undefined") return url
            return `${url}?revision_id=${revisionId}`
        }
    }
};