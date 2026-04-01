import type { LabelSpan, StyledLabel, StyledSegment } from "./types";

/**
 * A segment tree for labeled text. Maintains a set of labeled intervals
 * over a text range and supports incremental insert/remove with efficient
 * segment building.
 *
 * Internally: sorted boundary points with a per-gap label set.
 * Insert/remove update only affected gaps. `build()` produces the
 * final StyledSegment array by folding styles with the user's merge function.
 */
export class SegmentTree<S, L extends LabelSpan = LabelSpan> {
    private boundaries: number[];
    private gapLabels: Map<number, StyledLabel<S, L>[]>;
    private textLength: number;

    constructor(textLength: number) {
        this.textLength = textLength;
        this.boundaries = [0, textLength];
        this.gapLabels = new Map([[0, []]]);
    }

    /** Binary search for the index where `pos` is or would be inserted. */
    private findIndex(pos: number): number {
        let lo = 0;
        let hi = this.boundaries.length;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (this.boundaries[mid] < pos) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    /**
     * Ensure a boundary point exists. If `pos` falls inside an existing gap,
     * split that gap — the new sub-gap inherits the same label set.
     */
    private ensureBoundary(pos: number): void {
        const idx = this.findIndex(pos);
        if (idx < this.boundaries.length && this.boundaries[idx] === pos) return;

        // pos is inside the gap starting at boundaries[idx - 1]
        const gapStart = this.boundaries[idx - 1];
        const existing = this.gapLabels.get(gapStart) ?? [];

        this.boundaries.splice(idx, 0, pos);
        this.gapLabels.set(pos, [...existing]);
    }

    /** Add a styled label. O(B) where B is the number of boundary points. */
    insert(styledLabel: StyledLabel<S, L>): void {
        const { start, end } = styledLabel.label;
        if (start >= end || start < 0 || end > this.textLength) return;

        this.ensureBoundary(start);
        this.ensureBoundary(end);

        const startIdx = this.findIndex(start);
        const endIdx = this.findIndex(end);

        for (let i = startIdx; i < endIdx; i++) {
            const gapStart = this.boundaries[i];
            this.gapLabels.get(gapStart)!.push(styledLabel);
        }
    }

    /**
     * Remove all labels matching `predicate`, then merge adjacent gaps
     * that ended up with identical label sets.
     */
    remove(predicate: (label: L) => boolean): void {
        for (const [gapStart, labels] of this.gapLabels) {
            this.gapLabels.set(
                gapStart,
                labels.filter((sl) => !predicate(sl.label)),
            );
        }
        this.compact();
    }

    /** Merge adjacent gaps whose label sets are identical (by reference). */
    private compact(): void {
        let i = 0;
        while (i < this.boundaries.length - 2) {
            const curLabels = this.gapLabels.get(this.boundaries[i])!;
            const nextLabels = this.gapLabels.get(this.boundaries[i + 1])!;

            if (this.sameLabels(curLabels, nextLabels)) {
                this.gapLabels.delete(this.boundaries[i + 1]);
                this.boundaries.splice(i + 1, 1);
            } else {
                i++;
            }
        }
    }

    private sameLabels(
        a: StyledLabel<S, L>[],
        b: StyledLabel<S, L>[],
    ): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    /**
     * Produce the styled segment array. For each gap between consecutive
     * boundaries, folds the active labels' styles with `mergeStyles`
     * and slices the text.
     */
    build(
        text: string,
        mergeStyles: (styles: S[]) => S,
    ): StyledSegment<S, L>[] {
        const segments: StyledSegment<S, L>[] = [];

        for (let i = 0; i < this.boundaries.length - 1; i++) {
            const start = this.boundaries[i];
            const end = this.boundaries[i + 1];
            const styledLabels = this.gapLabels.get(start) ?? [];

            segments.push({
                start,
                end,
                text: text.slice(start, end),
                style: mergeStyles(styledLabels.map((sl) => sl.style)),
                labels: styledLabels.map((sl) => sl.label),
            });
        }

        return segments;
    }

    /** Number of boundary points (for testing/debugging). */
    get size(): number {
        return this.boundaries.length;
    }
}

/**
 * One-shot convenience: creates a tree, inserts all labels, builds segments.
 * Use SegmentTree directly if you need incremental insert/remove.
 */
export function segmentText<S, L extends LabelSpan = LabelSpan>(
    text: string,
    labels: StyledLabel<S, L>[],
    mergeStyles: (styles: S[]) => S,
): StyledSegment<S, L>[] {
    const tree = new SegmentTree<S, L>(text.length);
    for (const label of labels) {
        tree.insert(label);
    }
    return tree.build(text, mergeStyles);
}
