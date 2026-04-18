import { type Style, type Label, type Segmenter, type Segment, type ReducingSegmenter, type FullReducingSegmenter, makeReducedSegment, makeFullReducedSegment } from "./types";

function isSorted(nums : number[]) : boolean {
    for (let i = 1; i < nums.length; i++) {
        if (nums[i] < nums[i - 1]) {
            return false;
        }
    }
    return true;
}

export function makeBasicSegmenter<S extends Style>(gap: number = 0): Segmenter<S> {
    return (text: string, labels: Label<S>[]): Segment<S>[] => {
        const segments: Segment<S>[] = [];
        const labelsCopy = [...labels];
        if (!isSorted(labelsCopy.map(l => l.range.start))) {
            labelsCopy.sort((a, b) => a.range.start - b.range.start);
        }
        let curSegmentStart = 0;
        let curSegmentEnd = 0;
        let curSegmentLabels: Label<S>[] = [];
        for (const label of labelsCopy) {
            // check if no overlap with the current segment
            if (label.range.start >= curSegmentEnd + gap) {
                if (curSegmentEnd > curSegmentStart) {
                    segments.push({
                        labels: curSegmentLabels,
                        start: curSegmentStart,
                        text: text.slice(curSegmentStart, curSegmentEnd)
                    });
                }
                if (label.range.start > curSegmentEnd) {
                    // add a segment for the gap
                    segments.push({
                        labels: [],
                        start: curSegmentEnd,
                        text: text.slice(curSegmentEnd, label.range.start)
                    });
                }
                curSegmentStart = label.range.start;
                curSegmentEnd = label.range.end;
                curSegmentLabels = [{...label, range: {start: 0, end: label.range.end - label.range.start}}]; // adjust the label range to be relative to the segment start
            } else {
                // merge with the current segment
                curSegmentEnd = Math.max(curSegmentEnd, label.range.end);
                curSegmentLabels.push({...label, range: {start: label.range.start - curSegmentStart, end: label.range.end - curSegmentStart}}); // adjust the label range to be relative to the segment start
            }
        }
        if (curSegmentLabels.length > 0) {
            segments.push({
                labels: curSegmentLabels,
                start: curSegmentStart,
                text: text.slice(curSegmentStart, curSegmentEnd)
            });
        }
        if (curSegmentEnd < text.length) {
            segments.push({
                labels: [],
                start: curSegmentEnd,
                text: text.slice(curSegmentEnd)
            });
        }
        return segments;
    }
}


/**
 * Reduces the styles of all labels covering a region into one output style.
 * Implementations should define how to handle an empty list when unlabeled
 * segments are possible.
 */
export type StyleReducer<S extends Style> = (styles : S[]) => S

export function makeReducingSegmenter<S extends Style>(reducer: StyleReducer<S>, baseSegmenter: Segmenter<S>): ReducingSegmenter<S> {
    return (text: string, labels: Label<S>[]) => {
        const segments = baseSegmenter(text, labels);
        const newSegments: Segment<S>[] = [];
        for (const segment of segments) {
            const partition = new Set<number>()
            partition.add(0);
            if (segment.text.length === 0) {
                newSegments.push(segment);
                continue;
            }
            for (const label of segment.labels) {
                partition.add(label.range.start);
                partition.add(label.range.end);
            }
            partition.add(segment.text.length);
            const sortedPartition = Array.from(partition).sort((a, b) => a - b);
            const newLabels : Label<S>[] = [];
            for (let i = 0; i < sortedPartition.length - 1; i++) {
                const partStart = sortedPartition[i];
                const partEnd = sortedPartition[i + 1];
                const partLabels = segment.labels.filter(label => { return label.range.start <= partStart && label.range.end >= partEnd; });
                newLabels.push({
                    range: { start: partStart, end: partEnd },
                    style: reducer(partLabels.map(l => l.style))
                });
            }
            newSegments.push({
                start: segment.start,
                text: segment.text,
                labels: newLabels
            });
        }
        return newSegments.map(makeReducedSegment);
    }
}

export function makeFullReducingSegmenter<S extends Style>(reducer: StyleReducer<S>): FullReducingSegmenter<S> {
    return (text: string, labels: Label<S>[]) => {
        const partition = new Set<number>();
        partition.add(0);
        partition.add(text.length);
        for (const label of labels) {
            partition.add(label.range.start);
            partition.add(label.range.end);
        }
        const sortedPartition = Array.from(partition).sort((a, b) => a - b);
        const segments: Segment<S>[] = [];
        for (let i = 0; i < sortedPartition.length - 1; i++) {
            const partStart = sortedPartition[i];
            const partEnd = sortedPartition[i + 1];
            const partLabels = labels.filter(label => { return label.range.start <= partStart && label.range.end >= partEnd; });
            segments.push({
                start: partStart,
                text: text.slice(partStart, partEnd),
                labels: partLabels.length > 0 ? [{
                    range: { start: 0, end: partEnd - partStart },
                    style: reducer(partLabels.map(l => l.style))
                }] : []
            });
        }
        return segments.map(makeFullReducedSegment);
    }
}