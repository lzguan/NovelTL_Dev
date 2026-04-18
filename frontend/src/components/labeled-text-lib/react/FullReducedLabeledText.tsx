import { useMemo } from "react";

import { type BoldStyle, type ColorStyle, type ProductStyle, type UnderlineStyle, productReducer, makeBoldStyleReducer, makeColorStyleAverageReducer, makeUnderlineStyleReducer } from "../builtin/reducers";
import { rgb, toHex } from "../builtin/colors";
import { makeFullReducingSegmenter } from "../core/segmenter";
import { type Label } from "../core/types";
import { LabeledText } from "./LabeledText";
import type { Renderer, RendererProps } from "./Renderer";

export type FullReducedLabeledTextStyle = ProductStyle<[ColorStyle, UnderlineStyle, BoldStyle]>;

export type FullReducedLabeledTextProps = {
    text: string;
    labels: Label<FullReducedLabeledTextStyle>[];
    className?: string;
};

export function FullReducedLabeledText(props: FullReducedLabeledTextProps) {
    const segmenter = useMemo(
        () => makeFullReducingSegmenter<FullReducedLabeledTextStyle>(
            productReducer(
                makeColorStyleAverageReducer(rgb(255, 255, 0)),
                makeUnderlineStyleReducer(),
                makeBoldStyleReducer(),
            ),
        ),
        [],
    );

    const renderer = useMemo<Renderer<FullReducedLabeledTextStyle>>(() =>
        ({ segment } : RendererProps<FullReducedLabeledTextStyle> ) => {
                const style = segment.labels[0]?.style;

                if (!style) {
                    return <span>{segment.text}</span>;
                }

                const [colorStyle, underlineStyle, boldStyle] = style;
                const cssColor = toHex(colorStyle.color);

                return (
                    <span
                        style={{
                            backgroundColor: cssColor,
                            textDecoration: underlineStyle.underline ? `underline 2px solid ${cssColor}` : undefined,
                            fontWeight: boldStyle.bold ? 700 : 400,
                            borderRadius: "0.35rem",
                        }}
                    >
                        {segment.text}
                    </span>
                );
            },
        [],
    );

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
