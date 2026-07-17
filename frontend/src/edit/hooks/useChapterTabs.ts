import { useCallback, useRef, useState } from "react";
import type { CProvId } from "../controller/types/idTypes";

export type ChapterTab = {
	chapterId: CProvId;
	status: "loading" | "ready";
};

type Activation = "open" | "wait";

export function useChapterTabs() {
	const [tabs, setTabs] = useState<ChapterTab[]>([]);
	const [activeChapterId, setActiveChapterId] = useState<CProvId | null>(null);
	const tabsRef = useRef<ChapterTab[]>([]);
	const activeChapterIdRef = useRef<CProvId | null>(null);
	const closingRef = useRef(new Set<CProvId>());
	const pendingReopenRef = useRef(new Set<CProvId>());

	const updateTabs = useCallback((next: ChapterTab[]) => {
		tabsRef.current = next;
		setTabs(next);
	}, []);

	const updateActive = useCallback((chapterId: CProvId | null) => {
		activeChapterIdRef.current = chapterId;
		setActiveChapterId(chapterId);
	}, []);

	const activate = useCallback(
		(chapterId: CProvId): Activation => {
			const existing = tabsRef.current.find((tab) => tab.chapterId === chapterId);
			if (existing === undefined) {
				updateTabs([...tabsRef.current, { chapterId, status: "loading" }]);
			}
			updateActive(chapterId);
			if (closingRef.current.has(chapterId)) {
				pendingReopenRef.current.add(chapterId);
				return "wait";
			}
			return existing?.status === "loading" ? "wait" : "open";
		},
		[updateActive, updateTabs],
	);

	const markOpened = useCallback(
		(chapterId: CProvId) => {
			if (!tabsRef.current.some((tab) => tab.chapterId === chapterId)) return;
			updateTabs(
				tabsRef.current.map((tab) =>
					tab.chapterId === chapterId ? { ...tab, status: "ready" } : tab,
				),
			);
		},
		[updateTabs],
	);

	const close = useCallback(
		(chapterId: CProvId) => {
			const index = tabsRef.current.findIndex((tab) => tab.chapterId === chapterId);
			if (index === -1) {
				return { nextChapterId: activeChapterIdRef.current, requestClose: false };
			}
			const wasActive = activeChapterIdRef.current === chapterId;
			const remaining = tabsRef.current.filter((tab) => tab.chapterId !== chapterId);
			const nextChapterId = wasActive
				? (remaining[index]?.chapterId ?? remaining[index - 1]?.chapterId ?? null)
				: activeChapterIdRef.current;
			updateTabs(remaining);
			if (wasActive) updateActive(nextChapterId);

			if (closingRef.current.has(chapterId)) {
				pendingReopenRef.current.delete(chapterId);
				return { nextChapterId, requestClose: false };
			}
			closingRef.current.add(chapterId);
			return { nextChapterId, requestClose: true };
		},
		[updateActive, updateTabs],
	);

	const markClosed = useCallback((chapterId: CProvId): boolean => {
		closingRef.current.delete(chapterId);
		const shouldReopen =
			pendingReopenRef.current.delete(chapterId) &&
			tabsRef.current.some((tab) => tab.chapterId === chapterId);
		return shouldReopen;
	}, []);

	const markOpenFailed = useCallback(
		(chapterId: CProvId): CProvId | null => {
			const index = tabsRef.current.findIndex((tab) => tab.chapterId === chapterId);
			if (index === -1) return activeChapterIdRef.current;
			const wasActive = activeChapterIdRef.current === chapterId;
			const remaining = tabsRef.current.filter((tab) => tab.chapterId !== chapterId);
			const nextChapterId = wasActive
				? (remaining[index]?.chapterId ?? remaining[index - 1]?.chapterId ?? null)
				: activeChapterIdRef.current;
			updateTabs(remaining);
			if (wasActive) updateActive(nextChapterId);
			return nextChapterId;
		},
		[updateActive, updateTabs],
	);

	return {
		tabs,
		activeChapterId,
		activeChapterIdRef,
		activate,
		close,
		markOpened,
		markClosed,
		markOpenFailed,
	};
}
