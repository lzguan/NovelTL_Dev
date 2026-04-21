import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType } from "react";

import { makeBasicSegmentManager, type ManagedLabel, type SegmentManager } from "../core/segmentManager";
import type { Label, Style } from "../core/types";
import type { Renderer } from "./Renderer";
import type {
    CursorState,
    EditorCallbacks,
    EditorController,
    EditorState,
} from "./editorManager";

type DynamicLabeledTextProps<S extends Style, L extends Label<S>> = {
    initialText: string;
    initialLabels: ManagedLabel<S, L>[];
    gap?: number;
    render: Renderer<S, ManagedLabel<S, L>>;
    editable?: boolean;
    callbacks?: EditorCallbacks<S, L, HTMLDivElement>;
    containerStyle?: React.CSSProperties;
    overlayStyle?: React.CSSProperties;
    editorOverlayStyle?: React.CSSProperties;
    renderEditorOverlay?: ComponentType<EditorOverlayRenderContext<S, L>>;
    tabIndex?: number;
    onReady?: (manager: SegmentManager<S, L>) => void;
};

type CaretPositionLike = {
    offsetNode: Node;
    offset: number;
};

type CaretRangeDocument = Document & {
    caretPositionFromPoint?: (x: number, y: number) => CaretPositionLike | null;
};

export type EditorOverlayRect = {
    left: number;
    top: number;
    width: number;
    height: number;
};

export type EditorOverlayRenderContext<S extends Style, L extends Label<S>> = {
    state: EditorState;
    controller: EditorController<S, L>;
    containerRef: React.RefObject<HTMLDivElement | null>;
    editorOverlayRef: React.RefObject<HTMLDivElement | null>;
    resolveSelectionRects(selection: CursorState): EditorOverlayRect[];
};

type TextReplaceOp = {
    start: number;
    end: number;
    text: string;
};

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
}

function getClosestSegmentElement(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof Element)) {
        return null;
    }
    return target.closest("[data-segment-start]") as HTMLElement | null;
}

function getSegmentElementByStart(
    container: HTMLDivElement | null,
    start: number,
): HTMLElement | null {
    if (!container) {
        return null;
    }
    return container.querySelector(`[data-segment-start="${start}"]`) as HTMLElement | null;
}

function resolveTextOffset(container: HTMLElement, node: Node, offset: number): number {
    const range = container.ownerDocument.createRange();
    range.setStart(container, 0);
    try {
        range.setEnd(node, offset);
    } catch {
        return container.textContent?.length ?? 0;
    }
    return range.toString().length;
}

function resolveOffsetFromPoint(container: HTMLElement, clientX: number, clientY: number): number {
    const doc = container.ownerDocument as CaretRangeDocument;
    const caretPosition = doc.caretPositionFromPoint?.(clientX, clientY);
    if (caretPosition && container.contains(caretPosition.offsetNode)) {
        return resolveTextOffset(container, caretPosition.offsetNode, caretPosition.offset);
    }

    return container.textContent?.length ?? 0;
}

function resolveTextPointInElement(
    element: HTMLElement,
    offset: number,
): { node: Node; offset: number } | null {
    const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let traversed = 0;
    let lastTextNode: Node | null = null;

    while (walker.nextNode()) {
        const node = walker.currentNode;
        const textLength = node.textContent?.length ?? 0;
        lastTextNode = node;
        if (offset <= traversed + textLength) {
            return {
                node,
                offset: offset - traversed,
            };
        }
        traversed += textLength;
    }

    if (!lastTextNode) {
        return null;
    }

    return {
        node: lastTextNode,
        offset: lastTextNode.textContent?.length ?? 0,
    };
}

function resolveTextPointInContainer(
    container: HTMLElement,
    offset: number,
): { node: Node; offset: number } | null {
    return resolveTextPointInElement(container, offset);
}

function findTextReplacement(prev: string, next: string): TextReplaceOp | null {
    if (prev === next) {
        return null;
    }

    let start = 0;
    while (start < prev.length && start < next.length && prev[start] === next[start]) {
        start += 1;
    }

    let prevEnd = prev.length;
    let nextEnd = next.length;
    while (prevEnd > start && nextEnd > start && prev[prevEnd - 1] === next[nextEnd - 1]) {
        prevEnd -= 1;
        nextEnd -= 1;
    }

    return {
        start,
        end: prevEnd,
        text: next.slice(start, nextEnd),
    };
}

function DynamicLabeledText<S extends Style, L extends Label<S>>(
    props: DynamicLabeledTextProps<S, L>,
) {
    const {
        initialText,
        initialLabels,
        gap,
        render,
        editable = false,
        callbacks,
        containerStyle,
        overlayStyle,
        editorOverlayStyle,
        renderEditorOverlay,
        tabIndex = 0,
        onReady,
    } = props;

    const containerRef = useRef<HTMLDivElement | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const editorOverlayRef = useRef<HTMLDivElement | null>(null);
    const textLayerRef = useRef<HTMLDivElement | null>(null);
    const [manager] = useState(() =>
        makeBasicSegmentManager<S, L>(
            initialText,
            initialLabels,
            gap ?? 0,
        ),
    );
    const [segments, setSegments] = useState(() => manager.getSegments());
    const [editorState, setEditorState] = useState<EditorState>({
        cursor: null,
        highlight: null,
        hoveredLabelIds: [],
        mode: "idle",
    });

    useEffect(() => {
        return manager.subscribe(() => {
            setSegments(manager.getSegments());
        });
    }, [manager]);

    useEffect(() => {
        onReady?.(manager);
    }, [manager, onReady]);

    const readSelectionFromDom = useCallback(() => {
        const textLayer = textLayerRef.current;
        if (!textLayer) {
            return null;
        }

        const selection = textLayer.ownerDocument.defaultView?.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return null;
        }
        const anchorNode = selection.anchorNode;
        const focusNode = selection.focusNode;
        if (!anchorNode || !focusNode) {
            return null;
        }
        if (!textLayer.contains(anchorNode) || !textLayer.contains(focusNode)) {
            return null;
        }

        return {
            anchor: resolveTextOffset(textLayer, anchorNode, selection.anchorOffset),
            focus: resolveTextOffset(textLayer, focusNode, selection.focusOffset),
        };
    }, []);

    const controller = useMemo<EditorController<S, L>>(
        () => ({
            setCursor(cursor: CursorState | null) {
                setEditorState((prev) => ({ ...prev, cursor }));
            },
            setHighlight(highlight: CursorState | null) {
                setEditorState((prev) => ({ ...prev, highlight }));
            },
            clearInteraction() {
                setEditorState((prev) => ({
                    ...prev,
                    cursor: null,
                    highlight: null,
                    hoveredLabelIds: [],
                    mode: "idle",
                }));
            },
            addLabel(label: L & { id: string }) {
                manager.addLabel(label as ManagedLabel<S, L>);
            },
            updateLabel(id: string, label: L) {
                manager.updateLabel(id, label);
            },
            removeLabel(id: string) {
                manager.removeLabel(id);
            },
            insertTextAt(pos: number, text: string) {
                manager.insertTextAt(pos, text);
            },
            deleteTextAt(pos: number, length: number) {
                manager.deleteTextAt(pos, length);
            },
        }),
        [manager],
    );

    useLayoutEffect(() => {
        if (!editable) {
            return;
        }

        const textLayer = textLayerRef.current;
        if (!textLayer) {
            return;
        }

        const selectionState = editorState.highlight ?? editorState.cursor;
        if (!selectionState) {
            return;
        }

        const anchorPoint = resolveTextPointInContainer(textLayer, selectionState.anchor);
        const focusPoint = resolveTextPointInContainer(textLayer, selectionState.focus);
        if (!anchorPoint || !focusPoint) {
            return;
        }

        const selection = textLayer.ownerDocument.defaultView?.getSelection();
        if (!selection) {
            return;
        }

        const current = readSelectionFromDom();
        if (current && current.anchor === selectionState.anchor && current.focus === selectionState.focus) {
            return;
        }

        const range = textLayer.ownerDocument.createRange();
        range.setStart(anchorPoint.node, anchorPoint.offset);
        range.setEnd(focusPoint.node, focusPoint.offset);
        selection.removeAllRanges();
        selection.addRange(range);
    }, [editable, editorState.cursor, editorState.highlight, readSelectionFromDom, segments]);

    const resolveSelectionRects = useCallback((selection: CursorState) => {
        const editorOverlayElement = editorOverlayRef.current;
        const containerElement = containerRef.current;
        if (!editorOverlayElement || !containerElement) {
            return [];
        }

        const textLength = manager.getText().length;
        const start = clamp(Math.min(selection.anchor, selection.focus), 0, textLength);
        const end = clamp(Math.max(selection.anchor, selection.focus), 0, textLength);

        const resolveDocumentPoint = (pos: number) => {
            const segment = segments.find((candidate) => (
                pos >= candidate.start && pos < candidate.start + candidate.text.length
            )) ?? segments.at(-1);

            if (!segment) {
                return null;
            }

            const element = getSegmentElementByStart(containerElement, segment.start);
            if (!element) {
                return null;
            }

            const localOffset = segment === segments.at(-1) && pos === textLength
                ? segment.text.length
                : clamp(pos - segment.start, 0, segment.text.length);

            return resolveTextPointInElement(element, localOffset);
        };

        const startPoint = resolveDocumentPoint(start);
        const endPoint = resolveDocumentPoint(end);
        if (!startPoint || !endPoint) {
            return [];
        }

        const range = containerElement.ownerDocument.createRange();
        range.setStart(startPoint.node, startPoint.offset);
        range.setEnd(endPoint.node, endPoint.offset);

        const overlayRect = editorOverlayElement.getBoundingClientRect();
        const rawRects = start === end
            ? [range.getBoundingClientRect()]
            : Array.from(range.getClientRects());

        return rawRects
            .filter((rect) => rect.height > 0 || rect.width > 0)
            .map((rect) => ({
                left: rect.left - overlayRect.left,
                top: rect.top - overlayRect.top,
                width: rect.width,
                height: rect.height,
            }));
    }, [manager, segments]);

    const resolvePointerData = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const segmentElement = getClosestSegmentElement(event.target);
            const fallbackPos = editorState.cursor?.focus ?? 0;

            if (!segmentElement) {
                return {
                    pos: fallbackPos,
                    activeLabelIds: [] as string[],
                };
            }

            const start = Number(segmentElement.dataset.segmentStart);
            const segment = segments.find((candidate) => candidate.start === start);
            if (!segment) {
                return {
                    pos: fallbackPos,
                    activeLabelIds: [] as string[],
                };
            }

            const rawOffset = resolveOffsetFromPoint(segmentElement, event.clientX, event.clientY);
            const localOffset = clamp(rawOffset, 0, segment.text.length);

            return {
                pos: segment.start + localOffset,
                activeLabelIds: segment.labels
                    .filter((label) => label.range.start <= localOffset && label.range.end > localOffset)
                    .map((label) => label.id),
            };
        },
        [editorState.cursor, segments],
    );

    const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (!editable) {
            event.currentTarget.focus();
        }
        const { pos, activeLabelIds } = resolvePointerData(event);
        setEditorState((prev) => ({
            ...prev,
            hoveredLabelIds: activeLabelIds,
            mode: "pointing",
        }));
        callbacks?.onPointerDown?.({
            event,
            pos,
            state: editorState,
            controller,
            activeLabelIds,
        });
    }, [callbacks, controller, editable, editorState, resolvePointerData]);

    const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const { pos, activeLabelIds } = resolvePointerData(event);
        setEditorState((prev) => ({
            ...prev,
            hoveredLabelIds: activeLabelIds,
            mode: prev.mode === "pointing" && event.buttons !== 0 ? "selecting" : prev.mode,
        }));
        callbacks?.onPointerMove?.({
            event,
            pos,
            state: editorState,
            controller,
            activeLabelIds,
        });
    }, [callbacks, controller, editorState, resolvePointerData]);

    const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const { pos, activeLabelIds } = resolvePointerData(event);
        const domSelection = editable ? readSelectionFromDom() : null;
        setEditorState((prev) => ({
            ...prev,
            cursor: domSelection ?? prev.cursor,
            highlight: domSelection ?? prev.highlight,
            hoveredLabelIds: activeLabelIds,
            mode: "idle",
        }));
        callbacks?.onPointerUp?.({
            event,
            pos,
            state: editorState,
            controller,
            activeLabelIds,
        });
    }, [callbacks, controller, editable, editorState, readSelectionFromDom, resolvePointerData]);

    const handleClick = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const { pos, activeLabelIds } = resolvePointerData(event);
        callbacks?.onClick?.({
            event,
            pos,
            state: editorState,
            controller,
            activeLabelIds,
        });
    }, [callbacks, controller, editorState, resolvePointerData]);

    const handleDoubleClick = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const { pos, activeLabelIds } = resolvePointerData(event);
        callbacks?.onDoubleClick?.({
            event,
            pos,
            state: editorState,
            controller,
            activeLabelIds,
        });
    }, [callbacks, controller, editorState, resolvePointerData]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        callbacks?.onKeyDown?.({
            event,
            state: editorState,
            controller,
        });
    }, [callbacks, controller, editorState]);

    const handleKeyUp = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (editable) {
            const domSelection = readSelectionFromDom();
            if (domSelection) {
                setEditorState((prev) => ({
                    ...prev,
                    cursor: domSelection,
                    highlight: domSelection,
                }));
            }
        }
        callbacks?.onKeyUp?.({
            event,
            state: editorState,
            controller,
        });
    }, [callbacks, controller, editable, editorState, readSelectionFromDom]);

    const handleBeforeInput = useCallback((event: React.FormEvent<HTMLDivElement>) => {
        const nativeEvent = event.nativeEvent;
        if (!(nativeEvent instanceof InputEvent)) {
            return;
        }
        callbacks?.onBeforeInput?.({
            event: event as unknown as React.InputEvent<HTMLDivElement>,
            data: nativeEvent.data,
            inputType: nativeEvent.inputType,
            state: editorState,
            controller,
        });
    }, [callbacks, controller, editorState]);

    const handleInput = useCallback((event: React.FormEvent<HTMLDivElement>) => {
        const nativeEvent = event.nativeEvent;
        if (!(nativeEvent instanceof InputEvent)) {
            return;
        }
        if (editable) {
            const nextText = textLayerRef.current?.textContent ?? "";
            const replacement = findTextReplacement(manager.getText(), nextText);
            const domSelection = readSelectionFromDom();

            if (replacement) {
                if (replacement.end > replacement.start) {
                    manager.deleteTextAt(replacement.start, replacement.end - replacement.start);
                }
                if (replacement.text.length > 0) {
                    manager.insertTextAt(replacement.start, replacement.text);
                }
            }

            if (domSelection) {
                setEditorState((prev) => ({
                    ...prev,
                    cursor: domSelection,
                    highlight: domSelection,
                    mode: prev.mode === "composing" ? "composing" : "editing",
                }));
            }
        }
        callbacks?.onInput?.({
            event: event as unknown as React.InputEvent<HTMLDivElement>,
            state: editorState,
            controller,
        });
    }, [callbacks, controller, editable, editorState, manager, readSelectionFromDom]);

    const handleCopy = useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
        callbacks?.onCopy?.({
            event,
            state: editorState,
            controller,
        });
    }, [callbacks, controller, editorState]);

    const handleCut = useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
        callbacks?.onCut?.({
            event,
            state: editorState,
            controller,
        });
    }, [callbacks, controller, editorState]);

    const handlePaste = useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
        callbacks?.onPaste?.({
            event,
            state: editorState,
            controller,
        });
    }, [callbacks, controller, editorState]);

    const handleCompositionStart = useCallback((event: React.CompositionEvent<HTMLDivElement>) => {
        setEditorState((prev) => ({ ...prev, mode: "composing" }));
        callbacks?.onCompositionStart?.({
            event,
            state: editorState,
            controller,
        });
    }, [callbacks, controller, editorState]);

    const handleCompositionUpdate = useCallback((event: React.CompositionEvent<HTMLDivElement>) => {
        callbacks?.onCompositionUpdate?.({
            event,
            state: editorState,
            controller,
        });
    }, [callbacks, controller, editorState]);

    const handleCompositionEnd = useCallback((event: React.CompositionEvent<HTMLDivElement>) => {
        setEditorState((prev) => ({ ...prev, mode: editable ? "editing" : "idle" }));
        callbacks?.onCompositionEnd?.({
            event,
            state: editorState,
            controller,
        });
    }, [callbacks, controller, editable, editorState]);

    const handleSelect = useCallback(() => {
        if (!editable) {
            return;
        }
        const domSelection = readSelectionFromDom();
        if (!domSelection) {
            return;
        }
        setEditorState((prev) => ({
            ...prev,
            cursor: domSelection,
            highlight: domSelection,
        }));
    }, [editable, readSelectionFromDom]);

    const Overlay = render.renderOverlay;
    const Text = render.renderText;
    const EditorOverlay = renderEditorOverlay;
    const plainText = useMemo(
        () => segments.map((segment) => segment.text).join(""),
        [segments],
    );

    return (
        <div
            ref={containerRef}
            tabIndex={tabIndex}
            style={{ position: "relative", outline: "none", ...containerStyle }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onBeforeInput={handleBeforeInput}
            onInput={handleInput}
            onCopy={handleCopy}
            onCut={handleCut}
            onPaste={handlePaste}
            onCompositionStart={handleCompositionStart}
            onCompositionUpdate={handleCompositionUpdate}
            onCompositionEnd={handleCompositionEnd}
        >
            <div
                ref={overlayRef}
                style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, ...overlayStyle }}
            >
                {!editable && Overlay
                    ? segments.map((segment) => (
                        <Overlay
                            key={segment.id}
                            segment={segment}
                            containerRef={containerRef}
                            overlayRef={overlayRef}
                        />
                    ))
                    : null}
            </div>
            <div
                ref={editorOverlayRef}
                style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, ...editorOverlayStyle }}
            >
                {EditorOverlay ? (
                    <EditorOverlay
                        state={editorState}
                        controller={controller}
                        containerRef={containerRef}
                        editorOverlayRef={editorOverlayRef}
                        resolveSelectionRects={resolveSelectionRects}
                    />
                ) : null}
            </div>
            <div
                ref={textLayerRef}
                contentEditable={editable}
                suppressContentEditableWarning={editable}
                style={{ position: "relative", zIndex: 1, whiteSpace: "pre-wrap", outline: "none" }}
                onSelect={handleSelect}
            >
                {editable ? plainText : segments.map((segment) => (
                    <span key={segment.id} data-segment-start={segment.start}>
                        <Text segment={segment} />
                    </span>
                ))}
            </div>
        </div>
    );
}

export {
    DynamicLabeledText,
};
