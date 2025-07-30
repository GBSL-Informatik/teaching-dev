import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { EXCALIDRAW_STROKE_TYPES } from './constants';

export const getSelectedStrokeElements = (api: ExcalidrawImperativeAPI): ExcalidrawElement[] => {
    const selectedIds = new Set(Object.keys(api.getAppState().selectedElementIds));
    if (selectedIds.size > 0) {
        const selectedElements = api.getSceneElements().filter((e) => selectedIds.has(e.id));
        const hasStrokeWidth = selectedElements.every((e) => EXCALIDRAW_STROKE_TYPES.has(e.type));
        if (hasStrokeWidth) {
            return selectedElements;
        }
    }
    return [];
};
