import { useCallback, useRef, useState } from "react";
import type { SegmentManager } from "@/edit/lib/text-model/core/segmentManager";
import type { StyledLabel } from "@/edit/lib/text-model/core/types";
import type { LabelStyle, EditorMode } from "../managers/editorManager";
import type { CProvId, LProvId } from "../controller/types/idTypes";

export type Caret = {
	anchor: number;
	focus: number;
	visible: boolean;
};

type SM = SegmentManager<LabelStyle, StyledLabel<LabelStyle>, LProvId>;

export type EditorData =
	| { loading: true }
	| { loading: false; segmentManager: SM; chapterId: CProvId; caret: Caret | null };

export type LoadingPayload =
	| { loading: true }
	| { loading: false; segmentManager: SM; chapterId: CProvId };

export function useEditorState() {
	const [data, setData] = useState<EditorData>({ loading: true });
	const [modeState, setModeState] = useState<EditorMode>("view");

	const dataRef = useRef<EditorData>({ loading: true });
	const modeRef = useRef<EditorMode>("view");

	dataRef.current = data;
	modeRef.current = modeState;

	const setLoading = useCallback((val: LoadingPayload) => {
		const next: EditorData = val.loading
			? { loading: true }
			: {
					loading: false,
					segmentManager: val.segmentManager,
					chapterId: val.chapterId,
					caret: null,
				};
		dataRef.current = next;
		setData(next);
	}, []);

	const setCaret = useCallback((c: Caret | null) => {
		if (dataRef.current.loading) return;
		const next: EditorData = { ...dataRef.current, caret: c };
		dataRef.current = next;
		setData(next);
	}, []);

	const setMode = useCallback((m: EditorMode) => {
		modeRef.current = m;
		setModeState(m);
	}, []);

	return { data, mode: modeState, dataRef, modeRef, setLoading, setCaret, setMode };
}
