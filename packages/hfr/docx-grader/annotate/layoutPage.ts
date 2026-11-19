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

export interface PlacedLabel extends PlacedText {
    /** From the label through the right margin to the end of the line it describes, so it crosses no text. */
    arrow: Point[];
    /** Frames the described text when it does not end the line the arrow points to. */
    marker?: Box;
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
    const targeted = annotations
        .filter((annotation) => annotation.target)
        .sort((a, b) => a.target!.y - b.target!.y);
    const untargeted = annotations.filter((annotation) => !annotation.target);

    let nextFreeY = 0;
    const labels = targeted.map(({ label, target }) => {
        const glyphs = glyphBox(target!, scale);
        const targetY = glyphs.y + glyphs.height / 2;
        const text = placeText(wrap(label, MAX_LINE_LENGTH), LABEL_COLUMN_X, 0, LABEL_FONT_SIZE);
        const firstLineCenter = (LABEL_FONT_SIZE * LINE_HEIGHT) / 2;
        const y = Math.max(targetY - firstLineCenter, nextFreeY);
        nextFreeY = y + text.height + LABEL_GAP;
        const lineEnd: Point = [target!.lineRight * scale + ARROW_GAP, targetY];
        const arrow = arrowPoints([LABEL_COLUMN_X - 8, y + firstLineCenter], lineEnd, textRight + ARROW_GAP);
        return {
            ...text,
            y,
            arrow,
            ...(endsLine(target!) ? {} : { marker: padded(glyphs) })
        } satisfies PlacedLabel;
    });

    const noteLines = untargeted.flatMap(({ label }) => listItem(label, NOTES_MAX_LINE_LENGTH));
    if (noteLines.length === 0) {
        return { height: page.heightPt * scale, labels };
    }
    const notes = placeText(noteLines, 0, 0, NOTES_FONT_SIZE);
    return { height: page.heightPt * scale, labels, notes: { ...notes, y: -(notes.height + NOTES_GAP) } };
};

/** Bends at the right margin when the line ends left of it, e.g. in a column or a short line. */
const arrowPoints = (from: Point, lineEnd: Point, marginX: number): Point[] => {
    if (marginX <= lineEnd[0]) {
        return [from, lineEnd];
    }
    return [from, [marginX, lineEnd[1]], lineEnd];
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
