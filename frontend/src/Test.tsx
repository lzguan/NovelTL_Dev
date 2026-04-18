import { rgb } from "./components/labeled-text-lib/builtin/colors";
import { type BoldStyle, type ColorStyle, type ProductStyle, type UnderlineStyle } from "./components/labeled-text-lib/builtin/reducers";
import { makeBasicSegmenter } from "./components/labeled-text-lib/core/segmenter";
import { type Label } from "./components/labeled-text-lib/core/types";
import { FullReducedLabeledText } from "./components/labeled-text-lib/react/FullReducedLabeledText";
import { LabeledText } from "./components/labeled-text-lib/react/LabeledText";
import { makeBoxRenderer } from "./components/labeled-text-lib/react/Renderer";
import { PrototypeExpressiveLabeledText } from "./components/labeled-text-lib/react/PrototypeExpressiveLabeledText";

type DemoStyle = ProductStyle<[ColorStyle, UnderlineStyle, BoldStyle]>;

function toHexColor(color: number): string {
    return `#${color.toString(16).padStart(6, "0")}`;
}

const demoText = "Alice met Bob in Wonderland. The Queen of Hearts watched from afar.";

const demoLabels: Label<DemoStyle>[] = [
    {
        range: { start: 0, end: 5 },
        style: [
            { color: rgb(255, 214, 102) },
            { underline: true },
            { bold: false },
        ],
    },
    {
        range: { start: 10, end: 13 },
        style: [
            { color: rgb(130, 170, 255) },
            { underline: false },
            { bold: true },
        ],
    },
    {
        range: { start: 17, end: 27 },
        style: [
            { color: rgb(143, 240, 164) },
            { underline: true },
            { bold: false },
        ],
    },
    {
        range: { start: 17, end: 43 },
        style: [
            { color: rgb(255, 153, 102) },
            { underline: false },
            { bold: true },
        ],
    },
    {
        range: { start: 33, end: 48 },
        style: [
            { color: rgb(255, 102, 178) },
            { underline: true },
            { bold: true },
        ],
    },
    {
        range: { start: 58, end: 62 },
        style: [
            { color: rgb(180, 140, 255) },
            { underline: true },
            { bold: false },
        ],
    },
];

const measuredBoxText =
    "Alice met Bob in Wonderland. The Queen of Hearts watched from afar while Wonderland itself shimmered under layered labels.";

const measuredBoxLabels: Label<DemoStyle>[] = [
    {
        range: { start: 0, end: 5 },
        style: [
            { color: rgb(255, 214, 102) },
            { underline: true },
            { bold: false },
        ],
    },
    {
        range: { start: 10, end: 13 },
        style: [
            { color: rgb(130, 170, 255) },
            { underline: false },
            { bold: true },
        ],
    },
    {
        range: { start: 17, end: 27 },
        style: [
            { color: rgb(143, 240, 164) },
            { underline: true },
            { bold: false },
        ],
    },
    {
        range: { start: 17, end: 43 },
        style: [
            { color: rgb(255, 153, 102) },
            { underline: false },
            { bold: true },
        ],
    },
    {
        range: { start: 33, end: 48 },
        style: [
            { color: rgb(255, 102, 178) },
            { underline: true },
            { bold: true },
        ],
    },
    {
        range: { start: 73, end: 106 },
        style: [
            { color: rgb(180, 140, 255) },
            { underline: false },
            { bold: false },
        ],
    },
    {
        range: { start: 73, end: 122 },
        style: [
            { color: rgb(116, 185, 255) },
            { underline: true },
            { bold: false },
        ],
    },
];

const measuredBoxSegmenter = makeBasicSegmenter<DemoStyle>(1);

const measuredBoxRenderer = makeBoxRenderer<DemoStyle>({
    toBoxStyle: ([colorStyle, underlineStyle, boldStyle]) => ({
        backgroundColor: `${toHexColor(colorStyle.color)}2f`,
        border: `1px solid ${toHexColor(colorStyle.color)}7a`,
        borderRadius: "0.8rem",
        boxShadow: boldStyle.bold
            ? `0 0.35rem 1.35rem ${toHexColor(colorStyle.color)}2e, inset 0 0 0 1px ${toHexColor(colorStyle.color)}1f`
            : `0 0.2rem 0.8rem ${toHexColor(colorStyle.color)}1f, inset 0 0 0 1px ${toHexColor(colorStyle.color)}16`,
        backdropFilter: "blur(8px)",
        outline: underlineStyle.underline ? `2px solid ${toHexColor(colorStyle.color)}28` : undefined,
        outlineOffset: underlineStyle.underline ? "-3px" : undefined,
    }),
    textStyle: {
        color: "#18212b",
        fontFamily: '"Spectral", "Iowan Old Style", "Palatino Linotype", serif',
        fontSize: "1.08rem",
        letterSpacing: "0.01em",
        lineHeight: 1.95,
        textShadow: "0 1px 0 rgba(255, 255, 255, 0.65)",
    },
});

function Test() {
    return (
        <main
            style={{
                padding: "2.5rem 2rem 4rem",
                maxWidth: "52rem",
                margin: "0 auto",
                color: "#1f2937",
            }}
        >
            <h1>Labeled Text Library Demo</h1>
            <p>
                Temporary full-reduced rendering demo using a product style of color
                with independent underline and bold flags.
            </p>
            <div
                style={{
                    border: "1px solid #d4d4d8",
                    borderRadius: "0.75rem",
                    padding: "1rem",
                    lineHeight: 1.8,
                    backgroundColor: "#fffdf7",
                }}
            >
                <FullReducedLabeledText text={demoText} labels={demoLabels} />
            </div>
            <h2 style={{ marginTop: "2rem" }}>Prototype Expressive Renderer</h2>
            <p>
                Same labels, but rendered through the more general segmenter with a
                custom cluster-style renderer and <code>gap=1</code>.
            </p>
            <div
                style={{
                    border: "1px solid #d4d4d8",
                    borderRadius: "0.75rem",
                    padding: "1rem",
                    lineHeight: 1.8,
                    background: "linear-gradient(180deg, #fbfbff 0%, #f4f5ff 100%)",
                }}
            >
                <PrototypeExpressiveLabeledText text={demoText} labels={demoLabels} />
            </div>
            <h2 style={{ marginTop: "2rem" }}>Measured Box Renderer Prototype</h2>
            <p>
                Same general idea, but this one uses the DOM range API to place
                translucent boxes over the label spans inside each basic segment.
            </p>
            <div
                style={{
                    border: "1px solid #d7e4ea",
                    borderRadius: "1.25rem",
                    background:
                        "linear-gradient(180deg, rgba(248,252,252,0.98) 0%, rgba(238,247,247,0.98) 100%)",
                    padding: "1.25rem",
                    boxShadow: "0 1.25rem 3rem rgba(15, 23, 42, 0.08)",
                }}
            >
                <p
                    style={{
                        marginTop: 0,
                        marginBottom: "1rem",
                        color: "#52606d",
                        fontSize: "0.96rem",
                    }}
                >
                    Drag the lower-right corner of the box below to stress wrapping.
                </p>
                <div
                    style={{
                        resize: "horizontal",
                        overflow: "auto",
                        minWidth: "16rem",
                        width: "32rem",
                        maxWidth: "100%",
                        border: "1px solid rgba(148, 163, 184, 0.28)",
                        borderRadius: "1rem",
                        padding: "1.15rem 1.2rem 1.25rem",
                        background:
                            "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(246,250,252,0.92) 100%)",
                        boxShadow:
                            "inset 0 1px 0 rgba(255,255,255,0.85), 0 0.65rem 1.8rem rgba(15, 23, 42, 0.06)",
                    }}
                >
                    <LabeledText
                        text={measuredBoxText}
                        labels={measuredBoxLabels}
                        segment={measuredBoxSegmenter}
                        render={measuredBoxRenderer}
                    />
                </div>
            </div>
        </main>
    );
}

export { Test };
