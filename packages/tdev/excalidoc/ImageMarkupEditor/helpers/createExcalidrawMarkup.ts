import fileToDataUrl from '@tdev-components/util/localFS/fileToDataUrl';
import getImageDimensions from '@tdev-components/util/localFS/getImageDimensions';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { BinaryFileData, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import {
    EXCALIDRAW_BACKGROUND_FILE_ID,
    EXCALIDRAW_BACKGROUND_IMAGE_ID,
    EXCALIDRAW_IMAGE_RECTANGLE_ID,
    EXCALIDRAW_IMAGE_RECTANGLE,
    EXCALIDRAW_BACKGROUND_FILE,
    EXCALIDRAW_BACKGROUND_IMAGE
} from './constants';

export const createExcalidrawMarkup = async (
    imgFileHandle: FileSystemFileHandle
): Promise<ExcalidrawInitialDataState> => {
    const file = await imgFileHandle.getFile();
    const binData = await fileToDataUrl(file);
    const dimensions = await getImageDimensions(file);
    return {
        type: 'excalidraw',
        version: 2,
        elements: [
            {
                ...EXCALIDRAW_BACKGROUND_IMAGE,
                width: dimensions.width,
                height: dimensions.height
            } as ExcalidrawElement,
            {
                ...EXCALIDRAW_IMAGE_RECTANGLE,
                width: dimensions.width,
                height: dimensions.height
            } as ExcalidrawElement
        ],
        appState: {},
        files: {
            [EXCALIDRAW_BACKGROUND_FILE_ID]: {
                ...EXCALIDRAW_BACKGROUND_FILE,
                mimeType: file.type,
                dataURL: binData
            } as BinaryFileData
        }
    };
};

export const updateRectangleDimensions = (
    excalidrawState: ExcalidrawInitialDataState
): ExcalidrawInitialDataState => {
    if (!excalidrawState.elements) {
        return excalidrawState;
    }
    const backgroundImage = excalidrawState.elements.find((e) => e.id === EXCALIDRAW_BACKGROUND_IMAGE_ID);
    if (!backgroundImage || backgroundImage.type !== 'image') {
        return excalidrawState;
    }
    if (!excalidrawState.elements.find((e) => e.id === EXCALIDRAW_IMAGE_RECTANGLE_ID)) {
        (excalidrawState.elements as any).splice(1, 0, { ...EXCALIDRAW_IMAGE_RECTANGLE });
    }
    const rectangleElementIdx = excalidrawState.elements.findIndex(
        (e) => e.id === EXCALIDRAW_IMAGE_RECTANGLE_ID
    )!;
    (excalidrawState.elements as ExcalidrawElement[]).splice(rectangleElementIdx, 1, {
        ...excalidrawState.elements[rectangleElementIdx],
        width: backgroundImage.width,
        height: backgroundImage.height,
        x: backgroundImage.x,
        y: backgroundImage.y
    });
    return excalidrawState;
};
