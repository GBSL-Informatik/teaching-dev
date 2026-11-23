import type {
    ExcalidrawArrowElement,
    ExcalidrawElement,
    ExcalidrawRectangleElement,
    ExcalidrawTextElement
} from '@excalidraw/excalidraw/element/types';
import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import { backgroundImageScene } from '@tdev/excalidoc/ImageMarkupEditor/helpers/backgroundImageScene';
import { LINE_HEIGHT, PAGE_WIDTH, PageLayout, PlacedLabel, PlacedText, Point } from './layoutPage';

/** Colors from Excalidraw's color picker: blue, violet and orange. */
export const LABEL_COLOR = '#1971c2';
export const UNFRAMED_TEXT_LABEL_COLOR = '#9c36b5';
export const NOTES_COLOR = '#f08c00';
/** One per framed text on the same line, from left to right: blue, red, green and dark orange. */
export const FRAMED_TEXT_COLORS = ['#1971c2', '#e03131', '#2f9e44', '#e8590c'];
// Excalidraw's «Normal» font family.
const NORMAL_FONT_FAMILY = 6;
// Export settings of the markup editor: four times the scene size, with a small margin.
const EXPORT_SCALE = 4;
const EXPORT_PADDING = 4;

/**
 * A scene the markup editor of `@tdev/excalidoc` opens: the page as its background image, and the
 * labels, arrows and notes as ordinary elements, which stay editable. Saving it exports a WebP.
 */
export const excalidrawScene = (layout: PageLayout, pagePng: Buffer): ExcalidrawInitialDataState => {
    const scene = backgroundImageScene({
        dataURL: `data:image/png;base64,${pagePng.toString('base64')}`,
        mimeType: 'image/png',
        width: PAGE_WIDTH,
        height: layout.height,
        customData: {
            exportFormatMimeType: 'image/webp',
            scale: EXPORT_SCALE,
            exportPadding: EXPORT_PADDING,
            // The format of the original page, which the editor can restore.
            initExtension: '.png'
        }
    });
    return {
        ...scene,
        elements: [
            ...(scene.elements ?? []),
            ...layout.labels.flatMap((label, index) => labelElements(label, index)),
            ...(layout.notes ? [textElement('docx-grader-notes', layout.notes, NOTES_COLOR)] : [])
        ]
    };
};

const labelElements = (label: PlacedLabel, index: number): ExcalidrawElement[] => {
    const color = labelColor(label);
    const text = textElement(`docx-grader-label-${index}`, label, color);
    const arrow = arrowElement(`docx-grader-arrow-${index}`, label.arrow, color);
    if (!label.marker) {
        return [text, arrow];
    }
    const { x, y, width, height } = label.marker;
    const marker = baseElement(`docx-grader-marker-${index}`, 'rectangle', x, y, width, height, color);
    return [text, arrow, marker as ExcalidrawRectangleElement];
};

const labelColor = (label: PlacedLabel) => {
    if (label.marker) {
        return FRAMED_TEXT_COLORS[label.marker.indexOnLine % FRAMED_TEXT_COLORS.length];
    }
    return label.isParagraph ? LABEL_COLOR : UNFRAMED_TEXT_LABEL_COLOR;
};

/** Excalidraw stores the points of an arrow relative to its position, the first point. */
const arrowElement = (id: string, points: Point[], color: string) => {
    const [[x, y]] = points;
    const relative = points.map(([pointX, pointY]) => [pointX - x, pointY - y]);
    const xs = relative.map(([pointX]) => pointX);
    const ys = relative.map(([, pointY]) => pointY);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    return {
        ...baseElement(id, 'arrow', x, y, width, height, color),
        points: relative,
        startBinding: null,
        endBinding: null,
        lastCommittedPoint: null,
        startArrowhead: null,
        endArrowhead: 'triangle_outline',
        elbowed: false
    } as ExcalidrawArrowElement;
};

const textElement = (id: string, placed: PlacedText, color: string) => {
    const text = placed.lines.join('\n');
    return {
        ...baseElement(id, 'text', placed.x, placed.y, placed.width, placed.height, color),
        text,
        originalText: text,
        fontSize: placed.fontSize,
        fontFamily: NORMAL_FONT_FAMILY,
        textAlign: 'left' as const,
        verticalAlign: 'top' as const,
        containerId: null,
        lineHeight: LINE_HEIGHT as ExcalidrawTextElement['lineHeight'],
        autoResize: true
    } as ExcalidrawTextElement;
};

/** «Architect» sloppiness (roughness 0): straight lines like the typeset page. */
const baseElement = <Type extends ExcalidrawElement['type']>(
    id: string,
    type: Type,
    x: number,
    y: number,
    width: number,
    height: number,
    strokeColor: string
) => ({
    id,
    type,
    x,
    y,
    width,
    height,
    angle: 0,
    strokeColor,
    backgroundColor: 'transparent',
    fillStyle: 'solid' as const,
    strokeWidth: 1,
    strokeStyle: 'solid' as const,
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    // Excalidraw orders elements by fractional indices; restoring the scene assigns them.
    index: null,
    roundness: null,
    seed: 1,
    version: 1,
    versionNonce: 0,
    isDeleted: false,
    boundElements: null,
    updated: 0,
    link: null,
    locked: false
});
