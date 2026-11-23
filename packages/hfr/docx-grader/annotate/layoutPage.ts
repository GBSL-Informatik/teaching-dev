import { EXCALIDRAW_MAX_WIDTH } from '@tdev/excalidoc/ImageMarkupEditor/helpers/constants';
import { Annotation } from './annotationsOf';
import { TextBox } from './locateText';
import { PdfPage } from './readPdf';

/** The page is as wide as images the markup editor creates; labels go to a column on its right. */
export const PAGE_WIDTH = EXCALIDRAW_MAX_WIDTH;
const LABEL_FONT_SIZE = 16;
// General notes are larger: they are not next to the text they are about.
const NOTES_FONT_SIZE = 20;
export const LINE_HEIGHT = 1.25;
const LABEL_COLUMN_X = PAGE_WIDTH + 40;
const MAX_LINE_LENGTH = 34;
// Excalidraw measures text itself when the scene is opened; this estimate only spaces the labels.
const CHAR_WIDTH_PER_FONT_SIZE = 0.55;
const LABEL_GAP = 10;
// General notes go above the page, so they cover none of it.
const NOTES_GAP = 16;
const NOTES_MAX_LINE_LENGTH = 60;
// Space between an arrowhead or marker and the text, in pixels.
const ARROW_GAP = 6;
// Excalidraw draws an arrowhead at most half as long as the last segment.
const LAST_SEGMENT_MIN_LENGTH = 40;
const SAME_LINE_TOLERANCE = 6;
const MARKER_PADDING = 2;
// pdf.js boxes end at the baseline; descenders reach about a fifth of the font size below it.
const DESCENT = 0.2;

export interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface PlacedText extends Box {
    lines: string[];
    fontSize: number;
}

export type Point = [number, number];

export interface Marker extends Box {
    /** The position among the framed texts on the same line, from left to right. */
    indexOnLine: number;
}

export interface PlacedLabel extends PlacedText {
    /** From the label through the right margin to the end of the line it describes, so it crosses no text. */
    arrow: Point[];
    /** Frames the described text when it does not end the line the arrow points to. */
    marker?: Marker;
    isParagraph: boolean;
}

/** Where an annotation's arrow ends, right of the line its target is on. */
interface Pointer {
    label: string;
    isParagraph: boolean;
    end: Point;
    marker?: Marker;
}

export interface PageLayout {
    height: number;
    labels: PlacedLabel[];
    /** Annotations without a place on the page, as a list above it: its `y` is negative. */
    notes?: PlacedText;
}

/**
 * Places a label per annotation with a target in the column right of the page, as close to its
 * target as the labels above allow, and lists the others above the page.
 */
export const layoutPage = (page: PdfPage, annotations: Annotation[]): PageLayout => {
    const scale = PAGE_WIDTH / page.widthPt;
    const textRight = Math.max(0, ...page.texts.map((text) => text.x + text.width)) * scale;
    const pointers = annotations
        .filter((annotation) => annotation.target)
        .map((annotation) => pointerOf(annotation, scale));
    const untargeted = annotations.filter((annotation) => !annotation.target);

    let nextFreeY = 0;
    const labels = numberFramedPerLine(pointers)
        .sort((a, b) => a.end[1] - b.end[1] || (a.marker?.x ?? 0) - (b.marker?.x ?? 0))
        .map(({ label, isParagraph, end, marker }) => {
            const text = placeText(wrap(label, MAX_LINE_LENGTH), LABEL_COLUMN_X, 0, LABEL_FONT_SIZE);
            const firstLineCenter = (LABEL_FONT_SIZE * LINE_HEIGHT) / 2;
            const y = Math.max(end[1] - firstLineCenter, nextFreeY);
            nextFreeY = y + text.height + LABEL_GAP;
            const arrow = arrowPoints([LABEL_COLUMN_X - 8, y + firstLineCenter], end, textRight + ARROW_GAP);
            return { ...text, y, arrow, isParagraph, ...(marker ? { marker } : {}) } satisfies PlacedLabel;
        });

    const noteLines = untargeted.flatMap(({ label }) => listItem(label, NOTES_MAX_LINE_LENGTH));
    if (noteLines.length === 0) {
        return { height: page.heightPt * scale, labels };
    }
    const notes = placeText(noteLines, 0, 0, NOTES_FONT_SIZE);
    return { height: page.heightPt * scale, labels, notes: { ...notes, y: -(notes.height + NOTES_GAP) } };
};

const pointerOf = ({ label, target, isParagraph = false }: Annotation, scale: number): Pointer => {
    const glyphs = glyphBox(target!, scale);
    const end: Point = [target!.lineRight * scale + ARROW_GAP, glyphs.y + glyphs.height / 2];
    if (endsLine(target!)) {
        return { label, isParagraph, end };
    }
    return { label, isParagraph, end, marker: { ...padded(glyphs), indexOnLine: 0 } };
};

/** Numbers the framed texts on each line from left to right, so each can get its own color. */
const numberFramedPerLine = (pointers: Pointer[]): Pointer[] => {
    const framedByLine = groupByLine(pointers.filter((pointer) => pointer.marker));
    framedByLine.forEach((line) => line.sort((a, b) => a.marker!.x - b.marker!.x));
    const indexOnLine = new Map(
        framedByLine.flatMap((line) => line.map((pointer, index) => [pointer, index]))
    );
    return pointers.map((pointer) => {
        if (!pointer.marker) {
            return pointer;
        }
        return { ...pointer, marker: { ...pointer.marker, indexOnLine: indexOnLine.get(pointer)! } };
    });
};

const groupByLine = (pointers: Pointer[]): Pointer[][] => {
    const lines: Pointer[][] = [];
    for (const pointer of pointers) {
        const line = lines.find(([first]) => isSameLine(first, pointer));
        if (line) {
            line.push(pointer);
        } else {
            lines.push([pointer]);
        }
    }
    return lines;
};

// Text in another font on the same line has a slightly different box.
const isSameLine = (a: Pointer, b: Pointer) => {
    return Math.abs(a.end[0] - b.end[0]) < 1 && Math.abs(a.end[1] - b.end[1]) < SAME_LINE_TOLERANCE;
};

/** Ends horizontally, from the right margin or far enough right of the line for a full arrowhead. */
const arrowPoints = (from: Point, lineEnd: Point, marginX: number): Point[] => {
    const bendX = Math.max(marginX, lineEnd[0] + LAST_SEGMENT_MIN_LENGTH);
    if (bendX >= from[0]) {
        return [from, lineEnd];
    }
    return [from, [bendX, lineEnd[1]], lineEnd];
};

const endsLine = (target: TextBox) => {
    const tolerance = target.height / 2;
    return target.x + target.width >= target.lineRight - tolerance;
};

const glyphBox = (target: TextBox, scale: number): Box => ({
    x: target.x * scale,
    y: (target.y + target.height * DESCENT) * scale,
    width: target.width * scale,
    height: target.height * scale
});

const padded = (box: Box): Box => ({
    x: box.x - MARKER_PADDING,
    y: box.y - MARKER_PADDING,
    width: box.width + 2 * MARKER_PADDING,
    height: box.height + 2 * MARKER_PADDING
});

const placeText = (lines: string[], x: number, y: number, fontSize: number): PlacedText => ({
    lines,
    fontSize,
    x,
    y,
    width: Math.max(...lines.map((line) => line.length)) * fontSize * CHAR_WIDTH_PER_FONT_SIZE,
    height: lines.length * fontSize * LINE_HEIGHT
});

/** A list item per line of the label, continuation lines indented. */
const listItem = (label: string, maxLength: number): string[] => {
    return label
        .split('\n')
        .flatMap((line) =>
            wrapLine(line, maxLength - 2).map((part, index) => `${index === 0 ? '•' : ' '} ${part}`)
        );
};

/** Wraps each line of the text at word boundaries. */
const wrap = (text: string, maxLength: number): string[] => {
    return text.split('\n').flatMap((line) => wrapLine(line, maxLength));
};

const wrapLine = (text: string, maxLength: number): string[] => {
    const lines: string[] = [];
    for (const word of text.split(' ')) {
        const current = lines.at(-1);
        if (current !== undefined && current.length + word.length + 1 <= maxLength) {
            lines[lines.length - 1] = `${current} ${word}`;
        } else {
            lines.push(word);
        }
    }
    return lines;
};
