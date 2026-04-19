import { rgb } from "./components/labeled-text-lib/builtin/colors";
import { type BoldStyle, type ColorStyle, type ProductStyle, type UnderlineStyle } from "./components/labeled-text-lib/builtin/reducers";
import { makeBasicSegmenter } from "./components/labeled-text-lib/core/segmenters";
import { type Label } from "./components/labeled-text-lib/core/types";
import { StaticLabeledText } from "./components/labeled-text-lib/react/LabeledText";
import { makePlainBoxRenderer, makePlainTextRenderer } from "./components/labeled-text-lib/react/Renderer";

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
const plainSegmenter = makeBasicSegmenter<DemoStyle>();
const plainTextRenderer = {
    renderText: makePlainTextRenderer<DemoStyle>(),
};
const measuredBoxLayering = {
    containerStyle: {
        isolation: "isolate" as const,
    },
    overlayStyle: {
        zIndex: -1,
    },
};

const measuredBoxRenderer = makePlainBoxRenderer<DemoStyle>(([colorStyle, underlineStyle, boldStyle]) => ({
        backgroundColor: `${toHexColor(colorStyle.color)}2f`,
        border: `1px solid ${toHexColor(colorStyle.color)}7a`,
        borderRadius: "0.8rem",
        boxShadow: boldStyle.bold
            ? `0 0.35rem 1.35rem ${toHexColor(colorStyle.color)}2e, inset 0 0 0 1px ${toHexColor(colorStyle.color)}1f`
            : `0 0.2rem 0.8rem ${toHexColor(colorStyle.color)}1f, inset 0 0 0 1px ${toHexColor(colorStyle.color)}16`,
        backdropFilter: "blur(8px)",
        outline: underlineStyle.underline ? `2px solid ${toHexColor(colorStyle.color)}28` : undefined,
        outlineOffset: underlineStyle.underline ? "-3px" : undefined,
    }));

function buildStressDemo(blockCount: number): {
    text: string;
    labels: Label<DemoStyle>[];
} {
    const baseSentence =
        "Alice met Bob in Wonderland while the Queen of Hearts watched from afar and Wonderland itself shimmered under layered labels. ";
    const labels: Label<DemoStyle>[] = [];
    let text = "";

    for (let blockIndex = 0; blockIndex < blockCount; blockIndex += 1) {
        const blockStart = text.length;
        text += baseSentence;

        labels.push({
            range: { start: blockStart, end: blockStart + 5 },
            style: [
                { color: rgb(255, 214, 102) },
                { underline: true },
                { bold: false },
            ],
        });
        labels.push({
            range: { start: blockStart + 10, end: blockStart + 13 },
            style: [
                { color: rgb(130, 170, 255) },
                { underline: false },
                { bold: true },
            ],
        });
        labels.push({
            range: { start: blockStart + 17, end: blockStart + 27 },
            style: [
                { color: rgb(143, 240, 164) },
                { underline: true },
                { bold: false },
            ],
        });
        labels.push({
            range: { start: blockStart + 17, end: blockStart + 63 },
            style: [
                { color: rgb(255, 153, 102) },
                { underline: false },
                { bold: true },
            ],
        });
        labels.push({
            range: { start: blockStart + 38, end: blockStart + 57 },
            style: [
                { color: rgb(255, 102, 178) },
                { underline: true },
                { bold: true },
            ],
        });
        labels.push({
            range: { start: blockStart + 73, end: blockStart + 106 },
            style: [
                { color: rgb(180, 140, 255) },
                { underline: false },
                { bold: false },
            ],
        });
        labels.push({
            range: { start: blockStart + 73, end: blockStart + 120 },
            style: [
                { color: rgb(116, 185, 255) },
                { underline: true },
                { bold: false },
            ],
        });
    }

    return { text, labels };
}

const stressDemo = buildStressDemo(18);

function buildSparseStressDemo(blockCount: number): {
    text: string;
    labels: Label<DemoStyle>[];
} {
    const baseSentence =
        "Alice crossed the market square, Bob waited near the old fountain, and the city kept muttering about Wonderland in half-remembered fragments. ";
    const text = baseSentence.repeat(blockCount);
    const labels: Label<DemoStyle>[] = [];

    for (let blockIndex = 0; blockIndex < blockCount; blockIndex += 1) {
        const blockStart = blockIndex * baseSentence.length;

        if (blockIndex % 4 === 0) {
            labels.push({
                range: { start: blockStart, end: blockStart + 5 },
                style: [
                    { color: rgb(255, 214, 102) },
                    { underline: true },
                    { bold: false },
                ],
            });
        }

        if (blockIndex % 5 === 2) {
            labels.push({
                range: { start: blockStart + 29, end: blockStart + 32 },
                style: [
                    { color: rgb(130, 170, 255) },
                    { underline: false },
                    { bold: true },
                ],
            });
        }

        if (blockIndex % 6 === 1) {
            labels.push({
                range: { start: blockStart + 88, end: blockStart + 98 },
                style: [
                    { color: rgb(143, 240, 164) },
                    { underline: true },
                    { bold: false },
                ],
            });
        }
    }

    return { text, labels };
}

const sparseStressDemo = buildSparseStressDemo(40);

function collectLabeledTerms(
    text: string,
    entries: {
        term: string;
        style: DemoStyle;
    }[],
): Label<DemoStyle>[] {
    const labels: Label<DemoStyle>[] = [];

    for (const entry of entries) {
        let searchStart = 0;
        while (searchStart < text.length) {
            const index = text.indexOf(entry.term, searchStart);
            if (index === -1) {
                break;
            }
            labels.push({
                range: { start: index, end: index + entry.term.length },
                style: entry.style,
            });
            searchStart = index + entry.term.length;
        }
    }

    labels.sort((left, right) => left.range.start - right.range.start);
    return labels;
}

function buildChineseChapterDemo(paragraphCount: number): {
    text: string;
    labels: Label<DemoStyle>[];
} {
    const paragraph =
        "青云城夜雨未歇，林玄披着旧袍立在长街尽头，望着玄天宗方向翻涌的雷云。苏晚抱剑而来，只说黑风山的妖气又重了三分，陈长青已经先一步入山探路。洛清璃站在酒楼檐下，把镇魂塔的残图递给林玄，提醒他天命玉今夜必有异动。林玄记得三年前也是在青云城，也是苏晚陪他走出城门，而黑风山深处第一次传来镇魂塔的钟鸣。\n";
    const text = paragraph.repeat(paragraphCount);

    const labels = collectLabeledTerms(text, [
        {
            term: "林玄",
            style: [
                { color: rgb(255, 214, 102) },
                { underline: true },
                { bold: true },
            ],
        },
        {
            term: "苏晚",
            style: [
                { color: rgb(130, 170, 255) },
                { underline: false },
                { bold: true },
            ],
        },
        {
            term: "陈长青",
            style: [
                { color: rgb(143, 240, 164) },
                { underline: true },
                { bold: false },
            ],
        },
        {
            term: "洛清璃",
            style: [
                { color: rgb(255, 153, 102) },
                { underline: false },
                { bold: true },
            ],
        },
        {
            term: "玄天宗",
            style: [
                { color: rgb(180, 140, 255) },
                { underline: true },
                { bold: false },
            ],
        },
        {
            term: "黑风山",
            style: [
                { color: rgb(255, 102, 178) },
                { underline: true },
                { bold: true },
            ],
        },
        {
            term: "青云城",
            style: [
                { color: rgb(116, 185, 255) },
                { underline: false },
                { bold: false },
            ],
        },
        {
            term: "镇魂塔",
            style: [
                { color: rgb(255, 183, 77) },
                { underline: true },
                { bold: false },
            ],
        },
        {
            term: "天命玉",
            style: [
                { color: rgb(129, 212, 250) },
                { underline: false },
                { bold: true },
            ],
        },
    ]);

    return { text, labels };
}

const chineseChapterDemo = buildChineseChapterDemo(14);

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
                Temporary labeled-text renderer demos using a product style of color
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
                <StaticLabeledText
                    text={demoText}
                    labels={demoLabels}
                    segment={plainSegmenter}
                    render={plainTextRenderer}
                />
            </div>
            <h2 style={{ marginTop: "2rem" }}>Plain Box Renderer</h2>
            <p>
                Same text, but rendered through the current plain boxed renderer API.
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
                <StaticLabeledText
                    text={demoText}
                    labels={demoLabels}
                    segment={measuredBoxSegmenter}
                    render={measuredBoxRenderer}
                    containerStyle={measuredBoxLayering.containerStyle}
                    overlayStyle={measuredBoxLayering.overlayStyle}
                />
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
                    <StaticLabeledText
                        text={measuredBoxText}
                        labels={measuredBoxLabels}
                        segment={measuredBoxSegmenter}
                        render={measuredBoxRenderer}
                        containerStyle={measuredBoxLayering.containerStyle}
                        overlayStyle={measuredBoxLayering.overlayStyle}
                    />
                </div>
            </div>
            <h2 style={{ marginTop: "2rem" }}>Measured Box Stress Demo</h2>
            <p>
                Larger synthetic passage for rough performance checks. This one uses{" "}
                <code>{stressDemo.text.length}</code> characters and{" "}
                <code>{stressDemo.labels.length}</code> labels.
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
                <div
                    style={{
                        resize: "horizontal",
                        maxHeight: "26rem",
                        overflow: "auto",
                        minWidth: "18rem",
                        width: "40rem",
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
                    <StaticLabeledText
                        text={stressDemo.text}
                        labels={stressDemo.labels}
                        segment={measuredBoxSegmenter}
                        render={measuredBoxRenderer}
                        containerStyle={measuredBoxLayering.containerStyle}
                        overlayStyle={measuredBoxLayering.overlayStyle}
                    />
                </div>
            </div>
            <h2 style={{ marginTop: "2rem" }}>Sparse Label Stress Demo</h2>
            <p>
                Longer text with fewer labels to compare against the dense stress case.
                This one uses <code>{sparseStressDemo.text.length}</code> characters and{" "}
                <code>{sparseStressDemo.labels.length}</code> labels.
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
                <div
                    style={{
                        resize: "horizontal",
                        maxHeight: "26rem",
                        overflow: "auto",
                        minWidth: "18rem",
                        width: "40rem",
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
                    <StaticLabeledText
                        text={sparseStressDemo.text}
                        labels={sparseStressDemo.labels}
                        segment={measuredBoxSegmenter}
                        render={measuredBoxRenderer}
                        containerStyle={measuredBoxLayering.containerStyle}
                        overlayStyle={measuredBoxLayering.overlayStyle}
                    />
                </div>
            </div>
            <h2 style={{ marginTop: "2rem" }}>Synthetic Chinese Chapter Demo</h2>
            <p>
                Synthetic xianxia-style chapter text with recurring character, sect,
                item, and location names labeled throughout. This one uses{" "}
                <code>{chineseChapterDemo.text.length}</code> characters and{" "}
                <code>{chineseChapterDemo.labels.length}</code> labels.
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
                <div
                    style={{
                        resize: "horizontal",
                        maxHeight: "26rem",
                        overflow: "auto",
                        minWidth: "18rem",
                        width: "40rem",
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
                    <StaticLabeledText
                        text={chineseChapterDemo.text}
                        labels={chineseChapterDemo.labels}
                        segment={measuredBoxSegmenter}
                        render={measuredBoxRenderer}
                        containerStyle={measuredBoxLayering.containerStyle}
                        overlayStyle={measuredBoxLayering.overlayStyle}
                    />
                </div>
            </div>
        </main>
    );
}

export { Test };
