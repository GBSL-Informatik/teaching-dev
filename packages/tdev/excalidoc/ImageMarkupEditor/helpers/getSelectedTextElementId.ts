import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';

const getSelectedTextElementId = (api: ExcalidrawImperativeAPI): string | null => {
    const selectedIds = new Set(Object.keys(api.getAppState().selectedElementIds));
    if (selectedIds.size > 0) {
        const elements = api.getSceneElements();
        const selectedElements = elements.filter((e) => selectedIds.has(e.id));
        const textIds = selectedElements
            .filter((e) => e.type === 'text' || e.boundElements?.some((be) => be.type === 'text'))
            .map((e) => (e.type === 'text' ? e.id : e.boundElements!.find((be) => be.type === 'text')!.id));
        if (textIds.length === 1) {
            return textIds[0];
        }
    }
    return null;
};

export default getSelectedTextElementId;
