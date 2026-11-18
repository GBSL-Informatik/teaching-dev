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

export interface PlacedLabel {
    lines: string[];
    x: number;
    y: number;
    width: number;
    height: number;
    /** From the label to the text it describes. */
    arrow?: { from: [number, number]; to: [number, number] };
}

export interface PageLayout {
    height: number;
    labels: PlacedLabel[];
}

/**
 * Places a label per annotation in the column right of the page, as close to its target as the
 * labels above allow. Annotations without a target come first.
 */
export const layoutPage = (page: PdfPage, annotations: Annotation[]): PageLayout => {
    const scale = PAGE_WIDTH / page.widthPt;
    const ordered = [...annotations].sort((a, b) => (a.target?.y ?? -1) - (b.target?.y ?? -1));

    let nextFreeY = 0;
    const labels = ordered.map(({ label, target }) => {
        const lines = wrap(label, MAX_LINE_LENGTH);
        const height = lines.length * FONT_SIZE * LINE_HEIGHT;
        const width = Math.max(...lines.map((line) => line.length)) * CHAR_WIDTH;
        const targetY = target ? (target.y + target.height / 2) * scale : 0;
        const y = Math.max(targetY - (FONT_SIZE * LINE_HEIGHT) / 2, nextFreeY);
        nextFreeY = y + height + LABEL_GAP;

        const placed: PlacedLabel = { lines, x: LABEL_COLUMN_X, y, width, height };
        if (target) {
            const targetEnd: [number, number] = [(target.x + target.width) * scale + 6, targetY];
            placed.arrow = { from: [LABEL_COLUMN_X - 8, y + (FONT_SIZE * LINE_HEIGHT) / 2], to: targetEnd };
        }
        return placed;
    });
    return { height: page.heightPt * scale, labels };
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
