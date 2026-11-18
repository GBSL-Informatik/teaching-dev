import { backgroundImageScene } from '@tdev/excalidoc/ImageMarkupEditor/helpers/backgroundImageScene';
import { getScale } from '@tdev/excalidoc/ImageMarkupEditor/helpers/customProps';
import { FONT_SIZE, LINE_HEIGHT, PAGE_WIDTH, PageLayout, PlacedLabel, PlacedText } from './layoutPage';

/** Excalidraw's blue and orange from its color picker. */
export const LABEL_COLOR = '#1971c2';
export const NOTES_COLOR = '#f08c00';
// Excalidraw's «Normal» font family.
const NORMAL_FONT_FAMILY = 6;

export interface EncodedImage {
    data: Buffer;
    mimeType: string;
    /** e.g. `.webp` */
    extension: string;
}

/**
 * A scene the markup editor of `@tdev/excalidoc` opens: the page as its background image, and the
 * labels, arrows and notes as ordinary elements, which stay editable.
 */
export const excalidrawScene = (layout: PageLayout, page: EncodedImage) => {
    const scene = backgroundImageScene({
        dataURL: `data:${page.mimeType};base64,${page.data.toString('base64')}`,
        mimeType: page.mimeType,
        width: PAGE_WIDTH,
        height: layout.height,
        customData: {
            exportFormatMimeType: page.mimeType,
            scale: getScale(PAGE_WIDTH, layout.height),
            initExtension: page.extension
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

const labelElements = (label: PlacedLabel, index: number) => {
    const text = textElement(`docx-grader-label-${index}`, label, LABEL_COLOR);
    if (!label.arrow) {
        return [text];
    }
    const { from, to } = label.arrow;
    const width = Math.abs(to[0] - from[0]);
    const height = Math.abs(to[1] - from[1]);
    const arrow = {
        ...baseElement(`docx-grader-arrow-${index}`, 'arrow', from[0], from[1], width, height, LABEL_COLOR),
        points: [
            [0, 0],
            [to[0] - from[0], to[1] - from[1]]
        ],
        startArrowhead: null,
        endArrowhead: 'triangle_outline',
        elbowed: false
    };
    return [text, arrow];
};

const textElement = (id: string, placed: PlacedText, color: string) => {
    const text = placed.lines.join('\n');
    return {
        ...baseElement(id, 'text', placed.x, placed.y, placed.width, placed.height, color),
        text,
        originalText: text,
        fontSize: FONT_SIZE,
        fontFamily: NORMAL_FONT_FAMILY,
        textAlign: 'left',
        verticalAlign: 'top',
        containerId: null,
        lineHeight: LINE_HEIGHT,
        autoResize: true
    };
};

/** «Architect» sloppiness (roughness 0): straight lines like the typeset page. */
const baseElement = (
    id: string,
    type: string,
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
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
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
