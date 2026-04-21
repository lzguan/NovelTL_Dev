import type React from "react";

import type { Label, Style } from "../core/types";

export type CursorState = {
    anchor: number;
    focus: number;
};

export type EditorMode =
    | "idle"
    | "pointing"
    | "selecting"
    | "editing"
    | "composing";

export type EditorState = {
    cursor: CursorState | null;
    highlight: CursorState | null;
    hoveredLabelIds: string[];
    mode: EditorMode;
};

export type EditorController<S extends Style, L extends Label<S>> = {
    setCursor(cursor: CursorState | null): void;
    setHighlight(highlight: CursorState | null): void;
    clearInteraction(): void;
    addLabel(label: L & { id: string }): void;
    updateLabel(id: string, label: L): void;
    removeLabel(id: string): void;
    insertTextAt(pos: number, text: string): void;
    deleteTextAt(pos: number, length: number): void;
};

export type EditorPointerContext<S extends Style, L extends Label<S>, E extends HTMLElement = HTMLElement> = {
    event: React.PointerEvent<E>;
    pos: number;
    state: EditorState;
    controller: EditorController<S, L>;
    activeLabelIds: string[];
};

export type EditorKeyboardContext<S extends Style, L extends Label<S>, E extends HTMLElement = HTMLElement> = {
    event: React.KeyboardEvent<E>;
    state: EditorState;
    controller: EditorController<S, L>;
};

export type EditorTextInputContext<S extends Style, L extends Label<S>, E extends HTMLElement = HTMLElement> = {
    event: React.InputEvent<E>;
    state: EditorState;
    controller: EditorController<S, L>;
};

export type EditorBeforeInputContext<S extends Style, L extends Label<S>, E extends HTMLElement = HTMLElement> = {
    event: React.InputEvent<E>;
    data: string | null;
    inputType?: string;
    state: EditorState;
    controller: EditorController<S, L>;
};

export type EditorClipboardContext<S extends Style, L extends Label<S>, E extends HTMLElement = HTMLElement> = {
    event: React.ClipboardEvent<E>;
    state: EditorState;
    controller: EditorController<S, L>;
};

export type EditorCompositionContext<S extends Style, L extends Label<S>, E extends HTMLElement = HTMLElement> = {
    event: React.CompositionEvent<E>;
    state: EditorState;
    controller: EditorController<S, L>;
};

export type EditorCallbacks<S extends Style, L extends Label<S>, E extends HTMLElement = HTMLElement> = {
    onPointerDown?: (context: EditorPointerContext<S, L, E>) => void;
    onPointerMove?: (context: EditorPointerContext<S, L, E>) => void;
    onPointerUp?: (context: EditorPointerContext<S, L, E>) => void;
    onClick?: (context: EditorPointerContext<S, L, E>) => void;
    onDoubleClick?: (context: EditorPointerContext<S, L, E>) => void;
    onKeyDown?: (context: EditorKeyboardContext<S, L, E>) => void;
    onKeyUp?: (context: EditorKeyboardContext<S, L, E>) => void;
    onBeforeInput?: (context: EditorBeforeInputContext<S, L, E>) => void;
    onInput?: (context: EditorTextInputContext<S, L, E>) => void;
    onCopy?: (context: EditorClipboardContext<S, L, E>) => void;
    onCut?: (context: EditorClipboardContext<S, L, E>) => void;
    onPaste?: (context: EditorClipboardContext<S, L, E>) => void;
    onCompositionStart?: (context: EditorCompositionContext<S, L, E>) => void;
    onCompositionUpdate?: (context: EditorCompositionContext<S, L, E>) => void;
    onCompositionEnd?: (context: EditorCompositionContext<S, L, E>) => void;
};
