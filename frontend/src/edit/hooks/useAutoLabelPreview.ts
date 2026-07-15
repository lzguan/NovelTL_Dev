import { useCallback, useRef, useState } from "react";
import type { LabelBase } from "@/api/models";

export type AutoLabelPreview = readonly LabelBase[];

export function useAutoLabelPreview() {
	const [enabled, setEnabledState] = useState(false);
	const [preview, setPreviewState] = useState<AutoLabelPreview | null>(null);
	const enabledRef = useRef(false);
	const previewRef = useRef<AutoLabelPreview | null>(null);

	const setEnabled = useCallback((next: boolean) => {
		enabledRef.current = next;
		setEnabledState(next);

		if (!next) {
			previewRef.current = null;
			setPreviewState(null);
		}
	}, []);

	const setPreview = useCallback((next: AutoLabelPreview | null) => {
		if (next !== null && !enabledRef.current) return;

		const previewValue: AutoLabelPreview | null = next === null ? null : [...next];
		previewRef.current = previewValue;
		setPreviewState(previewValue);
	}, []);

	return {
		enabled,
		enabledRef,
		preview,
		previewRef,
		setEnabled,
		setPreview,
	};
}
