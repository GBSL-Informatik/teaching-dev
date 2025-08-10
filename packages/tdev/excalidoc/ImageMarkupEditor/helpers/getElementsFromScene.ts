import type {
    ExcalidrawImageElement,
    ExcalidrawRectangleElement,
    OrderedExcalidrawElement
} from '@excalidraw/excalidraw/element/types';
import {
    EXCALIDRAW_BACKGROUND_FILE_ID,
    EXCALIDRAW_BACKGROUND_IMAGE_ID,
    EXCALIDRAW_IMAGE_RECTANGLE_ID
} from './constants';
import type { BinaryFileData, BinaryFiles } from '@excalidraw/excalidraw/types';

export const getImageElementFromScene = (
    elements: readonly OrderedExcalidrawElement[]
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

export const getImageFileFromScene = (
    files?: BinaryFiles,
    id: string = EXCALIDRAW_BACKGROUND_FILE_ID
): BinaryFileData | undefined => {
    return files?.[id];
};
