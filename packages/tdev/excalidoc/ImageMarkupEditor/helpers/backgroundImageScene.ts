import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { BinaryFileData, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import {
    CustomData,
    EXCALIDRAW_BACKGROUND_FILE,
    EXCALIDRAW_BACKGROUND_FILE_ID,
    EXCALIDRAW_BACKGROUND_IMAGE,
    EXCALIDRAW_IMAGE_RECTANGLE
} from './constants';

interface BackgroundImage {
    dataURL: string;
    mimeType: string;
    /** Size of the image in the scene. */
    width: number;
    height: number;
    customData: CustomData;
}

/**
 * A markup scene for an image: the image as locked background and the frame around it.
 * Pure, so it can also build scenes outside the browser, e.g. in a CLI.
 */
export const backgroundImageScene = (image: BackgroundImage): ExcalidrawInitialDataState => {
    const size = { width: image.width, height: image.height };
    return {
        type: 'excalidraw',
        version: 2,
        elements: [
            { ...EXCALIDRAW_BACKGROUND_IMAGE, ...size, customData: image.customData } as ExcalidrawElement,
            { ...EXCALIDRAW_IMAGE_RECTANGLE, ...size } as ExcalidrawElement
        ],
        appState: {},
        files: {
            [EXCALIDRAW_BACKGROUND_FILE_ID]: {
                ...EXCALIDRAW_BACKGROUND_FILE,
                mimeType: image.mimeType,
                dataURL: image.dataURL
            } as BinaryFileData
        }
    };
};
