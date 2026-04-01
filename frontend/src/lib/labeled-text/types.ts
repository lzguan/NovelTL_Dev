type LabelSpan = {
    start: number;
    end: number;
}

type StyledLabel<S, L extends LabelSpan = LabelSpan> = {
    label: L;
    style: S;
}

type StyledSegment<S, L extends LabelSpan = LabelSpan> = {
    start: number;
    end: number;
    text: string;
    style: S;
    labels: L[];
}

export type { LabelSpan, StyledLabel, StyledSegment };