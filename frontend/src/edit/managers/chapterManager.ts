import { Effect } from "effect";
import type {
	NovelGetters,
	NovelUserEvent,
	TriggerEvent,
} from "../controller/types/controllerTypes";
import type { CProvId, LGProvId } from "../controller/types/idTypes";
import type { LoadingPayload } from "../hooks/useEditorState";
import type { useChapterList } from "../hooks/useChapterList";
import type { useChapterTabs } from "../hooks/useChapterTabs";

export function createChapterManager({
	controllerUserEvent,
	chapterList,
	chapterTabs,
	setLoading,
	labelGroupsRef,
}: {
	controllerUserEvent: (event: NovelUserEvent) => void;
	chapterList: ReturnType<typeof useChapterList>;
	chapterTabs: ReturnType<typeof useChapterTabs>;
	setLoading: (val: LoadingPayload) => void;
	labelGroupsRef: { current: Map<LGProvId, unknown> };
}) {
	function handleControllerEvent(
		_getters: NovelGetters,
		event: TriggerEvent,
	): Effect.Effect<void> {
		if (event.eventType === "chapterAdded") {
			chapterList.addChapter(event.chapter);
		} else if (event.eventType === "chapterOpened") {
			chapterTabs.markOpened(event.chapterId);
		} else if (event.eventType === "chapterClosed") {
			if (chapterTabs.markClosed(event.chapterId)) {
				openChapter(event.chapterId);
			}
		} else if (event.eventType === "chapterOpenFailed") {
			const wasActive = chapterTabs.activeChapterIdRef.current === event.chapterId;
			const nextChapterId = chapterTabs.markOpenFailed(event.chapterId);
			if (wasActive) switchChapter(nextChapterId);
		}
		return Effect.succeed(void 0);
	}

	function openChapter(chapterId: CProvId) {
		if (chapterTabs.activeChapterIdRef.current === chapterId) {
			setLoading({ loading: true, empty: false });
		}
		controllerUserEvent({
			eventType: "openChapter",
			chapterId,
			eagerLabelGroupIds: Array.from(labelGroupsRef.current.keys()),
			flags: { now: true, forEditor: true, fromCached: true },
		});
	}

	function switchChapter(chapterId: CProvId | null) {
		if (chapterId === null) {
			setLoading({ empty: true });
			return;
		}
		setLoading({ loading: true, empty: false });
		if (chapterTabs.activate(chapterId) === "wait") return;
		openChapter(chapterId);
	}

	function closeChapter(chapterId: CProvId) {
		const wasActive = chapterTabs.activeChapterIdRef.current === chapterId;
		const result = chapterTabs.close(chapterId);
		if (result.requestClose) {
			controllerUserEvent({
				eventType: "closeChapter",
				chapterId,
			});
		}
		if (wasActive) switchChapter(result.nextChapterId);
	}

	function addChapter(chapterNum: number, chapterTitle: string, chapterIsPublic: boolean) {
		controllerUserEvent({
			eventType: "addChapter",
			chapterNum,
			chapterTitle,
			chapterIsPublic,
		});
	}

	return { handleControllerEvent, switchChapter, closeChapter, addChapter };
}
