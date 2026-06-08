import type { ProvId } from "./idTypes";
import type { RequestEvent } from "./requestTypes";
import type { Prov } from "./helperTypes";
import type {
	AddLabelOp,
	Chapter,
	DeleteLabelOp,
	Label,
	LabelData,
	LabelGroup,
	UpdateLabelOp,
} from "@/api/models";
import type { Effect } from "effect";

export type LabelOp = AddLabelOp | DeleteLabelOp | UpdateLabelOp;

export type LoadingStatus = "notLoaded" | "loading" | "loaded" | "loadError";

export type LabelDataEntry =
	| { status: "notLoaded" | "loading" | "loadError" }
	| {
			status: "loaded";
			labelData: Prov<LabelData>;
			labels: Prov<Label>[]; // sorted by start position
	  };

export type ChapterDataEntry<ControllerT> =
	| { status: "notLoaded" | "loading" | "loadError" }
	| { status: "loaded"; controller: ControllerT };

export type NovelDataManager<ChapterControllerT> = {
	addLabelGroup: (labelGroupName: string) => Effect.Effect<RequestEvent[]>;
	addChapter: (
		chapterNum: number,
		chapterTitle: string,
		chapterIsPublic: boolean,
	) => Effect.Effect<RequestEvent[], Error>;
	openChapter: (
		chapterId: ProvId,
		getMyState: () => "notLoaded" | "loading" | "loadError" | "loaded",
		setMyState: (state: ChapterDataEntry<ChapterControllerT>) => void,
	) => Effect.Effect<RequestEvent[], Error>;

	getters: {
		getGroups: () => readonly Prov<LabelGroup>[];
		getChapters: () => readonly Prov<Chapter>[];
	};
};

export type ChapterDataManager = {
	addLabel: (
		labelGroupId: string,
		labelDataId: string,
		startPos: number,
		endPos: number,
		word: string,
		entityGroup?: string,
		score?: number,
		dirty?: boolean,
	) => Effect.Effect<ProvId, Error>;
	deleteLabel: (
		labelGroupId: string,
		labelDataId: string,
		startPos: number,
		endPos: number,
	) => Effect.Effect<ProvId, Error>;
	updateLabel: (
		labelGroupId: string,
		labelDataId: string,
		startPos: number,
		endPos: number,
		newStartPos?: number | null,
		newEndPos?: number | null,
		newWord?: string | null,
		entityGroup?: string,
		score?: number,
		dirty?: boolean,
	) => Effect.Effect<ProvId, Error>;
	insertTextAt: (pos: number, text: string) => Effect.Effect<void, Error>;
	deleteTextAt: (startPos: number, endPos: number) => Effect.Effect<void, Error>;

	flush: () => Effect.Effect<RequestEvent[]>;

	reloadGroup(labelGroupId: string): Effect.Effect<RequestEvent[]>;

	destroy: () => Effect.Effect<RequestEvent[]>;
};
