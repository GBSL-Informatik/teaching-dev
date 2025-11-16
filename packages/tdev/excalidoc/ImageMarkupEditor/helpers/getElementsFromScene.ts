import type {
    ExcalidrawElement,
    ExcalidrawImageElement,
    ExcalidrawRectangleElement,
    NonDeletedExcalidrawElement,
    Ordered,
    OrderedExcalidrawElement
} from '@excalidraw/excalidraw/element/types';
import {
    EXCALIDRAW_BACKGROUND_FILE_ID,
    EXCALIDRAW_BACKGROUND_IMAGE_ID,
    EXCALIDRAW_IMAGE_RECTANGLE_ID,
    EXCALIDRAW_STANDALONE_DRAWING_ID
} from './constants';
import type { BinaryFileData, BinaryFiles } from '@excalidraw/excalidraw/types';

export const getImageElementFromScene = (
    elements: readonly (OrderedExcalidrawElement | ExcalidrawElement)[]
): [ExcalidrawImageElement | undefined, number] => {
    const imgIdx = elements.findIndex((e) => e.id === EXCALIDRAW_BACKGROUND_IMAGE_ID);

    return [elements[imgIdx] as ExcalidrawImageElement, imgIdx];
};

export const getRectangleElementFromScene = (
    elements: readonly OrderedExcalidrawElement[]
): [ExcalidrawRectangleElement | undefined, number] => {
    const rectIdx = elements.findIndex((e) => e.id === EXCALIDRAW_IMAGE_RECTANGLE_ID);

    return [elements[rectIdx] as ExcalidrawRectangleElement, rectIdx];
};

/**
 * @return either the EXCALIDRAW_BACKGROUND_IMAGE or the EXCALIDRAW_STANDALONE_DRAWING Element
 */
export const getMetaElementFromScene = (elements: readonly OrderedExcalidrawElement[]) => {
    const metaIds = new Set<string>([EXCALIDRAW_BACKGROUND_IMAGE_ID, EXCALIDRAW_STANDALONE_DRAWING_ID]);
    return elements.find((e) => metaIds.has(e.id));
};

export const getImageFileFromScene = (
    files?: BinaryFiles,
    id: string = EXCALIDRAW_BACKGROUND_FILE_ID
): BinaryFileData | undefined => {
    return files?.[id];
};

const MetaElementIds = new Set<string>([EXCALIDRAW_IMAGE_RECTANGLE_ID, EXCALIDRAW_STANDALONE_DRAWING_ID]);

export const withoutMetaElements = (
    elements: readonly Ordered<NonDeletedExcalidrawElement>[] | readonly ExcalidrawElement[]
) => {
    return elements.filter((e) => !MetaElementIds.has(e.id));
};
