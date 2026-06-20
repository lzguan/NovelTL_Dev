import type { TextOp } from "@/api/models";
import type { NovelGetters, SubscriberFn, TriggerEvent } from "../controller/types/controllerTypes";
import type { CProvId, LProvId } from "../controller/types/idTypes";
import type { IDLabelOp } from "../controller/types/dataTypes";
import type { Caret } from "@/components/labeled-text-lib/react/DynamicLabeledText";
import type { ColorStyle, ProductStyle } from "@/components/labeled-text-lib/builtin/reducers";
import type { SegmentManager } from "@/components/labeled-text-lib/core/segmentManager";
import type { StyledLabel } from "@/components/labeled-text-lib/core/types";

export type LabelStyle = ProductStyle<
	[
		ColorStyle,
		{
			cursorStatus: "clicked" | "hovered" | "none";
		} & ({ visible: true; active: true } | { visible: boolean; active: false }),
	]
>;

export type EditorMode = "edit" | "view" | "label";

export type EditorTriggers =
	| { eventType: "loadingStart" }
	| { eventType: "loadingEnd" }
	| { eventType: "modeChange"; mode: EditorMode }
	| { eventType: "hoverPosChange"; pos: number | null }
	| { eventType: "caretChange"; caret: Caret | null }
	| { eventType: "chapterSwitch"; chapterId: CProvId }
	| { eventType: "textOp"; op: TextOp }
	| { eventType: "labelOp"; op: IDLabelOp }
	| { eventType: "errorOccured"; error: unknown };

/**
 * Placeholder getters type for Editor manager. Will be updated as needed.
 */
type EditorManagerGetters = {
	isLoading: () => boolean;
	mode: () => EditorMode;
	manager: SegmentManager<LabelStyle, StyledLabel<LabelStyle>, LProvId>;
};

/**
 * Interface for the Editor manager. Stores all data that is relevant to rendering the editor. Acts as a bridge from any component that is relevant to rendering the editor to the controller. Specifically, stores the following:
 * - Currently open chapter
 * - Label groups/label datas
 * - Segments (see labeled text library)
 */
export interface EditorManager {
	/**
	 * Respond to trigger events emitted by the controller.
	 */
	handleTriggerEvent: SubscriberFn<NovelGetters, TriggerEvent>;
	/**
	 * Send a message to the controller to switch the currently open chapter.
	 */
	switchChapter(chapterId: CProvId): void;
	/**
	 * Send a text operation text op to the controller, or reject if the mode is not "edit".
	 */
	textOp(op: TextOp): void;
	/**
	 * Send a label operation label op to the controller, along with the target label group id. Reject if the mode is not "label".
	 */
	labelOp(op: IDLabelOp): void;
	/**
	 * Switch the editor mode between edit, view, and label.
	 */
	switchMode(mode: EditorMode): void;
	/**
	 * Set the position of the mouse hover. If null is passed, it means the mouse is not hovering over any text.
	 */
	hoverPos(pos: number | null): void;
	/**
	 * Set the position of the caret.
	 */
	setCaret(caret: Caret | null): void;
	/**
	 * Subscribe to changes in the editor manager's state.
	 */
	subscribe: (callback: SubscriberFn<EditorManagerGetters, EditorTriggers>) => () => void;
	/**
	 * Get the current state of the editor manager.
	 */
	getters: EditorManagerGetters;
}
