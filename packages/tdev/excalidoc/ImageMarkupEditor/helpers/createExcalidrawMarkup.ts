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
    EXCALIDRAW_BACKGROUND_IMAGE,
    EXCALIDRAW_MAX_WIDTH,
    CustomData,
    EXCALIDRAW_STANDALONE_DRAWING_ID,
    EXCALIDRAW_STANDALONE_DRAWING_RECTANGLE
} from './constants';
import { withoutMetaElements } from './getElementsFromScene';
import { getBoundingRect } from './getBoundingRect';

export const createExcalidrawMarkup = async (
    imgFileHandle: FileSystemFileHandle
): Promise<ExcalidrawInitialDataState> => {
    const file = await imgFileHandle.getFile();
    const binData = await fileToDataUrl(file);
    const dimensions = await getImageDimensions(file, EXCALIDRAW_MAX_WIDTH);
    return {
        type: 'excalidraw',
        version: 2,
        elements: [
            {
                ...EXCALIDRAW_BACKGROUND_IMAGE,
                width: dimensions.width,
                height: dimensions.height,
                customData: {
                    exportFormatMimeType: file.type,
                    scale: dimensions.scale,
                    initExtension: `.${file.name.split('.').pop() || 'png'}`
                } satisfies CustomData
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

const handleStandaloneDrawing = (excalidrawState: ExcalidrawInitialDataState): ExcalidrawInitialDataState => {
    if (!excalidrawState.elements) {
        return excalidrawState;
    }
    const standaloneDrawingIdx = excalidrawState.elements.findIndex(
        (e) => e.id === EXCALIDRAW_STANDALONE_DRAWING_ID
    );
    if (standaloneDrawingIdx < 0) {
        return excalidrawState;
    }
    const elements = withoutMetaElements(excalidrawState.elements);
    const { x, y, width, height } = getBoundingRect(elements);

    (excalidrawState.elements as ExcalidrawElement[]).splice(standaloneDrawingIdx, 1, {
        ...excalidrawState.elements[standaloneDrawingIdx],
        strokeWidth: EXCALIDRAW_STANDALONE_DRAWING_RECTANGLE.strokeWidth,
        strokeColor: EXCALIDRAW_STANDALONE_DRAWING_RECTANGLE.strokeColor,
        width,
        height,
        x: x,
        y: y
    });
    return excalidrawState;
};

export const updateRectangleDimensions = (
    excalidrawState: ExcalidrawInitialDataState
): ExcalidrawInitialDataState => {
    if (!excalidrawState.elements) {
        return excalidrawState;
    }
    const backgroundImage = excalidrawState.elements.find((e) => e.id === EXCALIDRAW_BACKGROUND_IMAGE_ID);
    if (!backgroundImage) {
        const isStandaloneDrawing = excalidrawState.elements.some(
            (e) => e.id === EXCALIDRAW_STANDALONE_DRAWING_ID
        );
        if (!isStandaloneDrawing) {
            // add standalone markup drawing rectangle
            (excalidrawState.elements as ExcalidrawElement[]).splice(0, 0, {
                ...EXCALIDRAW_STANDALONE_DRAWING_RECTANGLE
            });
        }
        return handleStandaloneDrawing(excalidrawState);
    }
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
