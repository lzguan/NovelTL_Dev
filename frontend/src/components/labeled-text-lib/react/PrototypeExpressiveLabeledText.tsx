import { useMemo } from "react";

import {  blue, green, red, toHex } from "../builtin/colors";
import { type BoldStyle, type ColorStyle, type ProductStyle, type UnderlineStyle } from "../builtin/reducers";
import { makeBasicSegmenter } from "../core/segmenter";
import { type Label } from "../core/types";
import { LabeledText } from "./LabeledText";
import { type Renderer } from "./Renderer";

export type PrototypeExpressiveLabeledTextStyle = ProductStyle<[ColorStyle, UnderlineStyle, BoldStyle]>;

export type PrototypeExpressiveLabeledTextProps = {
    text: string;
    labels: Label<PrototypeExpressiveLabeledTextStyle>[];
    className?: string;
};

function alphaColor(color: number, alpha: number): string {
    return `rgba(${red(color)}, ${green(color)}, ${blue(color)}, ${alpha})`;
}

export function PrototypeExpressiveLabeledText(props: PrototypeExpressiveLabeledTextProps) {
    const segmenter = useMemo(
        () => makeBasicSegmenter<PrototypeExpressiveLabeledTextStyle>(1),
        [],
    );

    const renderer = useMemo<Renderer<PrototypeExpressiveLabeledTextStyle>>(
        () => ({ segment }) => {
                if (segment.labels.length === 0) {
                    return <span style={{ whiteSpace: "pre-wrap" }}>{segment.text}</span>;
                }

                const sortedLabels = [...segment.labels].sort((left, right) => {
                    const leftLength = left.range.end - left.range.start;
                    const rightLength = right.range.end - right.range.start;

                    return rightLength - leftLength;
                });

                const dominantStyles = segment.labels.map((label) => label.style);
                const dominantUnderline = dominantStyles.some(([, underlineStyle]) => underlineStyle.underline);
                const dominantBold = dominantStyles.some(([, , boldStyle]) => boldStyle.bold);

                return (
                    <span
                        style={{
                            position: "relative",
                            display: "inline-block",
                            whiteSpace: "pre",
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
                            letterSpacing: "0",
                            paddingBlock: `${0.18 + 0.12 * Math.min(sortedLabels.length, 3)}rem`,
                            lineHeight: 1.6,
                        }}
                    >
                        {sortedLabels.map((label, index) => {
                            const [colorStyle, underlineStyle, boldStyle] = label.style;
                            const labelLength = label.range.end - label.range.start;
                            const insetY = index * 3;
                            const cssColor = toHex(colorStyle.color);

                            return (
                                <span
                                    key={`${label.range.start}:${label.range.end}:${index}`}
                                    style={{
                                        position: "absolute",
                                        left: `calc(${label.range.start}ch + 0.02rem)`,
                                        width: `calc(${labelLength}ch - 0.04rem)`,
                                        top: `${insetY}px`,
                                        bottom: `${Math.max(0, 2 - insetY)}px`,
                                        borderRadius: `${0.45 + 0.10 * Math.min(index, 3)}rem`,
                                        backgroundColor: alphaColor(colorStyle.color, 0.16 + 0.05 * Math.min(index + 1, 4)),
                                        border: `1px solid ${alphaColor(colorStyle.color, 0.42)}`,
                                        boxShadow: [
                                            `0 0.08rem 0.18rem ${alphaColor(colorStyle.color, 0.16)}`,
                                            `0 0 0.65rem ${alphaColor(colorStyle.color, 0.10)}`,
                                            index > 0
                                                ? `inset 0 0 0 ${1 + index}px ${alphaColor(colorStyle.color, 0.12)}`
                                                : undefined,
                                        ].filter(Boolean).join(", "),
                                        backdropFilter: "blur(6px)",
                                        WebkitBackdropFilter: "blur(6px)",
                                        zIndex: index + 1,
                                        pointerEvents: "none",
                                        textDecoration: underlineStyle.underline ? `underline 2px solid ${cssColor}` : undefined,
                                        fontWeight: boldStyle.bold ? 700 : 500,
                                    }}
                                />
                            );
                        })}
                        <span
                            style={{
                                position: "relative",
                                zIndex: sortedLabels.length + 2,
                                color: "#111827",
                                textDecoration: dominantUnderline ? "underline" : undefined,
                                fontWeight: dominantBold ? 700 : 500,
                            }}
                        >
                            {segment.text}
                        </span>
                    </span>
                );
            }, []
        )
        

    return (
        <div className={props.className}>
            <LabeledText
                text={props.text}
                labels={props.labels}
                segment={segmenter}
                render={renderer}
            />
        </div>
    );
}
