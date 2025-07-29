import fileToDataUrl from '@tdev-components/util/localFS/fileToDataUrl';
import getImageDimensions from '@tdev-components/util/localFS/getImageDimensions';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { BinaryFileData, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';

export const EXCALIDRAW_BACKGROUND_IMAGE_ID = 'TDEV-BACKGROUND-IMAGE' as const;
export const EXCALIDRAW_IMAGE_RECTANGLE_ID = 'TDEV-IMAGE--RECTANGLE' as const;
export const EXCALIDRAW_BACKGROUND_FILE_ID = 'TDEV-BACKGROUND--FILE' as const;
export const EXCALIDRAW_RED = '#e03131' as const;
export const EXCALIDRAW_STROKE_TYPES = new Set([
    'arrow',
    'line',
    'rectangle',
    'diamond',
    'ellipse',
    'freedraw'
]);

const EXCALIDRAW_RECTANGLE = {
    id: EXCALIDRAW_IMAGE_RECTANGLE_ID,
    type: 'rectangle',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    strokeColor: '#1e1e1e',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'dotted',
    roughness: 0,
    opacity: 100,
    locked: true
} as ExcalidrawElement;

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
                id: EXCALIDRAW_BACKGROUND_IMAGE_ID,
                type: 'image',
                x: 0,
                y: 0,
                width: dimensions.width,
                height: dimensions.height,
                roughness: 0,
                opacity: 100,
                isDeleted: false,
                fileId: EXCALIDRAW_BACKGROUND_FILE_ID,
                scale: [1, 1],
                locked: true
            } as ExcalidrawElement,
            {
                ...EXCALIDRAW_RECTANGLE,
                width: dimensions.width,
                height: dimensions.height
            } as ExcalidrawElement
        ],
        appState: {},
        files: {
            [EXCALIDRAW_BACKGROUND_FILE_ID]: {
                id: EXCALIDRAW_BACKGROUND_FILE_ID,
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
        console.log('nono', excalidrawState);
        return excalidrawState;
    }
    if (!excalidrawState.elements.find((e) => e.id === EXCALIDRAW_IMAGE_RECTANGLE_ID)) {
        (excalidrawState.elements as any).splice(1, 0, { ...EXCALIDRAW_RECTANGLE });
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
