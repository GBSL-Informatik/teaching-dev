import {
    EXCALIDRAW_BACKGROUND_FILE,
    EXCALIDRAW_BACKGROUND_FILE_ID,
    EXCALIDRAW_BACKGROUND_IMAGE,
    EXCALIDRAW_IMAGE_RECTANGLE
} from '@tdev/excalidoc/ImageMarkupEditor/helpers/constants';
import { getScale } from '@tdev/excalidoc/ImageMarkupEditor/helpers/customProps';
import { FONT_SIZE, LINE_HEIGHT, PAGE_WIDTH, PageLayout, PlacedLabel } from './layoutPage';

export const ANNOTATION_COLOR = '#1971c2';
// Excalifont, the hand-drawn font of Excalidraw.
const HANDWRITING_FONT_FAMILY = 5;

/**
 * A scene the markup editor of `@tdev/excalidoc` opens: the page as its background image, and the
 * labels and arrows as ordinary elements, which stay editable.
 */
export const excalidrawScene = (layout: PageLayout, pagePng: Buffer) => {
    const background = { width: PAGE_WIDTH, height: layout.height };
    return {
        type: 'excalidraw',
        version: 2,
        elements: [
            {
                ...EXCALIDRAW_BACKGROUND_IMAGE,
                ...background,
                customData: {
                    exportFormatMimeType: 'image/png',
                    scale: getScale(background.width, background.height),
                    initExtension: '.png'
                }
            },
            { ...EXCALIDRAW_IMAGE_RECTANGLE, ...background },
            ...layout.labels.flatMap((label, index) => labelElements(label, index))
        ],
        appState: {},
        files: {
            [EXCALIDRAW_BACKGROUND_FILE_ID]: {
                ...EXCALIDRAW_BACKGROUND_FILE,
                mimeType: 'image/png',
                dataURL: `data:image/png;base64,${pagePng.toString('base64')}`,
                created: 0
            }
        }
    };
};

const labelElements = (label: PlacedLabel, index: number) => {
    const text = label.lines.join('\n');
    const textElement = {
        ...baseElement(`docx-grader-label-${index}`, 'text', label.x, label.y, label.width, label.height),
        text,
        originalText: text,
        fontSize: FONT_SIZE,
        fontFamily: HANDWRITING_FONT_FAMILY,
        textAlign: 'left',
        verticalAlign: 'top',
        containerId: null,
        lineHeight: LINE_HEIGHT,
        autoResize: true
    };
    if (!label.arrow) {
        return [textElement];
    }
    const { from, to } = label.arrow;
    const arrow = {
        ...baseElement(
            `docx-grader-arrow-${index}`,
            'arrow',
            from[0],
            from[1],
            Math.abs(to[0] - from[0]),
            Math.abs(to[1] - from[1])
        ),
        points: [
            [0, 0],
            [to[0] - from[0], to[1] - from[1]]
        ],
        startArrowhead: null,
        endArrowhead: 'arrow',
        elbowed: false
    };
    return [textElement, arrow];
};

const baseElement = (id: string, type: string, x: number, y: number, width: number, height: number) => ({
    id,
    type,
    x,
    y,
    width,
    height,
    angle: 0,
    strokeColor: ANNOTATION_COLOR,
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 1,
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
