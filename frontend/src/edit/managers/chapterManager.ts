import type { NovelGetters, SubscriberFn, TriggerEvent } from "../controller/types/controllerTypes";
import type { CProvId, ProvChapter } from "../controller/types/idTypes";

export type ChapterManagerGetters = {
	chapters: () => ProvChapter[];
};

export type ChapterTriggerEvent =
	| { eventType: "chapterSwitch"; chapterId: CProvId }
	| { eventType: "chapterListUpdate" };

export type ChapterManager = {
	handleTriggerEvent: SubscriberFn<NovelGetters, TriggerEvent>;
	subscribe: (callback: SubscriberFn<ChapterManagerGetters, ChapterTriggerEvent>) => () => void;
	getters: ChapterManagerGetters;
};
