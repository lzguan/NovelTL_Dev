import type { Renderer } from "./Renderer";
import { type Style, type Label, type Segmenter } from "../core/types";

function LabeledText<S extends Style>(props: { 
    text: string, 
    labels: Label<S>[], 
    segment: Segmenter<S>, 
    render : Renderer<S>
}) {
    const segments = props.segment(props.text, props.labels);
    return (
        <div>
            {segments.map((segment) => (
                <props.render
                    segment={segment}
                    key={`${segment.start}:${segment.start+segment.text.length}`}
                />
            ))}
        </div>
    );
}

export {
    LabeledText
}
