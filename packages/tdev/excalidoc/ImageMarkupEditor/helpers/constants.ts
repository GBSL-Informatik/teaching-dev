import type { ExcalidrawElement, ExcalidrawImageElement } from '@excalidraw/excalidraw/element/types';
import { BinaryFileData } from '@excalidraw/excalidraw/types';

export const EXCALIDRAW_BACKGROUND_IMAGE_ID = 'TDEV-BACKGROUND-IMAGE' as const;
export const EXCALIDRAW_IMAGE_RECTANGLE_ID = 'TDEV-IMAGE--RECTANGLE' as const;
export const EXCALIDRAW_BACKGROUND_FILE_ID = 'TDEV-BACKGROUND--FILE' as const;
export const EXCALIDRAW_STANDALONE_DRAWING_ID = 'TDEV-STANDALONE-DRAWING' as const;
export const EXCALIDRAW_RED = '#e03131' as const;
export const EXCALIDRAW_STROKE_TYPES = new Set([
    'arrow',
    'line',
    'rectangle',
    'diamond',
    'ellipse',
    'freedraw'
]);

export const EXCALIDRAW_MAX_WIDTH = 800;
export const EXCALIDRAW_MAX_EXPORT_WIDTH = 3840;
export const EXCALIDRAW_EXPORT_QUALITY = 0.8;
export interface CustomData {
    exportFormatMimeType: 'image/webp' | string;
    scale: number;
    initExtension: '.png' | '.jpg' | '.jpeg' | '.webp' | string;
}

export const EXCALIDRAW_IMAGE_RECTANGLE = {
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

export const EXCALIDRAW_STANDALONE_DRAWING_RECTANGLE = {
    id: EXCALIDRAW_STANDALONE_DRAWING_ID,
    type: 'rectangle',
    x: 0,
    y: 0,
    width: 400,
    height: 300,
    strokeColor: '#1e1e1e',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'dotted',
    roughness: 0,
    opacity: 100,
    locked: true
} as ExcalidrawElement;

export const NEW_EXCALIDRAW_DRAWING = {
    type: 'excalidraw',
    version: 2,
    elements: [EXCALIDRAW_STANDALONE_DRAWING_RECTANGLE],
    appState: {},
    files: {}
};

export const VALID_EXPORT_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.svg', '.webp']);

export const EXCALIDRAW_BACKGROUND_IMAGE = {
    id: EXCALIDRAW_BACKGROUND_IMAGE_ID,
    type: 'image',
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    roughness: 0,
    opacity: 100,
    isDeleted: false,
    fileId: EXCALIDRAW_BACKGROUND_FILE_ID,
    scale: [1, 1],
    locked: true
} as ExcalidrawImageElement;

export const EXCALIDRAW_BACKGROUND_FILE = {
    id: EXCALIDRAW_BACKGROUND_FILE_ID,
    mimeType: 'image/webp',
    dataURL: ''
} as BinaryFileData;
