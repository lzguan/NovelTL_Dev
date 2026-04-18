/* Abstract Types */


export type Style = object


/**
 * Half-open character range into the source text: [start, end).
 * `start` is inclusive and `end` is exclusive.
 */
export type Range = {
    start: number;
    end: number;
};

/**
 * Source annotation over the full text.
 *
 * Label ranges are canonical document coordinates. Segmenters may project them
 * into segment-local coordinates in their output.
 */
export type Label<S extends Style> = {
    range : Range;
    style : S
}

/**
 * A disjoint rendered slice of text.
 *
 * Segments are ordered by `start` and are intended to partition some region of
 * the source text. For segment-local consumers, each label range in `labels` is
 * relative to `segment.start`, not to the full document.
 */
export type Segment<S extends Style> = {
    start : number;
    text : string;
    labels : Label<S>[];
}

declare const reducedBrand: unique symbol;
declare const fullReducedBrand: unique symbol;

export type ReducedSegment<S extends Style> = Segment<S> & { [reducedBrand] : true };

export function makeReducedSegment<S extends Style>(segment: Segment<S>): ReducedSegment<S> {
    return segment as ReducedSegment<S>;
}

export type FullReducedSegment<S extends Style> = ReducedSegment<S> & { [fullReducedBrand] : true };

export function makeFullReducedSegment<S extends Style>(segment: Segment<S>): FullReducedSegment<S> {
    return segment as FullReducedSegment<S>;
}

/**
 * Produces renderable text segments from source text and absolute labels.
 */
export type Segmenter<S extends Style> = (text : string, labels : Label<S>[]) => Segment<S>[];


export type ReducingSegmenter<S extends Style> = (text : string, labels : Label<S>[]) => ReducedSegment<S>[];

export type FullReducingSegmenter<S extends Style> = (text : string, labels : Label<S>[]) => FullReducedSegment<S>[];
