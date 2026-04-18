import React, { useCallback, useEffect, useLayoutEffect, useRef, useState, type JSX } from "react";

import type { Segment, Style } from "../core/types";

export type RendererProps<S extends Style> = {
    segment: Segment<S>;
}

/**
 * Rendering strategy for a segmented text view.
 */
export type Renderer<S extends Style> = ({ segment }: RendererProps<S>) => JSX.Element;


export type BoxRendererOptions<S extends Style> = {
    toBoxStyle: (style: S) => React.CSSProperties;
    textStyle? : React.CSSProperties;
    className?: string;
}

export function makeBoxRenderer<S extends Style>(options: BoxRendererOptions<S>): Renderer<S> {
    return ({ segment }) => {
        const textRef = useRef<HTMLSpanElement | null>(null);
        const [styledBoxes, setStyledBoxes] = useState<{ rect: {left : number; top: number; width: number; height: number}; style: S }[]>([]);

        const measure = useCallback(() => {
            const element = textRef.current;
            const textNode = element?.firstChild?.firstChild;
            if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
                setStyledBoxes([]);
                return;
            }
            const containerRect = element.getBoundingClientRect();
            const styledRects = segment.labels.map(label => {
                const range = document.createRange();
                range.setStart(textNode, label.range.start);
                range.setEnd(textNode, label.range.end);
                return Array.from(range.getClientRects()).map(rect => ({ rect : { height: rect.height, width: rect.width, top: rect.top - containerRect.top, left: rect.left - containerRect.left }, style: label.style }));
            }).flat();
            setStyledBoxes(styledRects);
        }, [segment]);

        useLayoutEffect(() => {
            measure();
        }, [measure]);

        useEffect(() => {
            const element = textRef.current;
            if (!element) {
                return;
            }
            const resizeObserver = new ResizeObserver(() => {
                measure();
            });
            resizeObserver.observe(element);
            return () => {
                resizeObserver.disconnect();
            };
        }, [measure]);

        return <span className={options.className} ref={textRef} style={{ position: "relative", whiteSpace: "pre-wrap", display: "inline-block"}}>
            <span style={{ position: "relative", zIndex: 1, ...options.textStyle}}>{segment.text}</span>
            <span aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", userSelect: "none", zIndex: 0}}>
                {styledBoxes.map(({ rect, style }, index) => (
                    <div
                        key={segment.start + ":" + index}
                        style={{
                            position: "absolute",
                            left: rect.left,
                            top: rect.top,
                            width: rect.width,
                            height: rect.height,
                            pointerEvents: "none",
                            ...options.toBoxStyle(style),
                        }}
                    />
                ))}
            </span>
        </span>;
    }
}
