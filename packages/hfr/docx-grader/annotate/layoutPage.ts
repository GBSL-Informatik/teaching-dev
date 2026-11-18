import { EXCALIDRAW_MAX_WIDTH } from '@tdev/excalidoc/ImageMarkupEditor/helpers/constants';
import { Annotation } from './annotationsOf';
import { PdfPage } from './readPdf';

/** The page is as wide as images the markup editor creates; labels go to a column on its right. */
export const PAGE_WIDTH = EXCALIDRAW_MAX_WIDTH;
export const FONT_SIZE = 16;
export const LINE_HEIGHT = 1.25;
const LABEL_COLUMN_X = PAGE_WIDTH + 40;
const MAX_LINE_LENGTH = 34;
// Excalidraw measures text itself when the scene is opened; this estimate only spaces the labels.
const CHAR_WIDTH = FONT_SIZE * 0.55;
const LABEL_GAP = 10;
// General notes go into the top margin of the page, which is empty in most documents.
const NOTES_POSITION = { x: 16, y: 12 };
const NOTES_MAX_LINE_LENGTH = 60;

export interface PlacedText {
    lines: string[];
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface PlacedLabel extends PlacedText {
    /** From the label to the text it describes. */
    arrow?: { from: [number, number]; to: [number, number] };
}

export interface PageLayout {
    height: number;
    labels: PlacedLabel[];
    /** Annotations without a place on the page, as a list at its top left. */
    notes?: PlacedText;
}

/**
 * Places a label per annotation with a target in the column right of the page, as close to its
 * target as the labels above allow, and lists the others at the top left of the page.
 */
export const layoutPage = (page: PdfPage, annotations: Annotation[]): PageLayout => {
    const scale = PAGE_WIDTH / page.widthPt;
    const targeted = annotations
        .filter((annotation) => annotation.target)
        .sort((a, b) => a.target!.y - b.target!.y);
    const untargeted = annotations.filter((annotation) => !annotation.target);

    let nextFreeY = 0;
    const labels = targeted.map(({ label, target }) => {
        const targetY = (target!.y + target!.height / 2) * scale;
        const text = placeText(wrap(label, MAX_LINE_LENGTH), LABEL_COLUMN_X, 0);
        const y = Math.max(targetY - (FONT_SIZE * LINE_HEIGHT) / 2, nextFreeY);
        nextFreeY = y + text.height + LABEL_GAP;
        const targetEnd: [number, number] = [(target!.x + target!.width) * scale + 6, targetY];
        return {
            ...text,
            y,
            arrow: { from: [LABEL_COLUMN_X - 8, y + (FONT_SIZE * LINE_HEIGHT) / 2], to: targetEnd }
        } satisfies PlacedLabel;
    });

    const noteLines = untargeted.flatMap(({ label }) => listItem(label, NOTES_MAX_LINE_LENGTH));
    const notes = noteLines.length > 0 ? placeText(noteLines, NOTES_POSITION.x, NOTES_POSITION.y) : undefined;
    return { height: page.heightPt * scale, labels, ...(notes ? { notes } : {}) };
};

const placeText = (lines: string[], x: number, y: number): PlacedText => ({
    lines,
    x,
    y,
    width: Math.max(...lines.map((line) => line.length)) * CHAR_WIDTH,
    height: lines.length * FONT_SIZE * LINE_HEIGHT
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
