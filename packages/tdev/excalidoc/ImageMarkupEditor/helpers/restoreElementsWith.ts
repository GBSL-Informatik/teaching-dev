import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type * as ExcalidrawLib from '@excalidraw/excalidraw';
import { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';

const restoreElementsWith = (
    restoreFn: typeof ExcalidrawLib.restoreElements,
    api: ExcalidrawImperativeAPI,
    toUpdate: { id: string }[],
    updateFn: (e: ExcalidrawElement) => Partial<ExcalidrawElement>
) => {
    const all = api.getSceneElementsIncludingDeleted();
    const elements = all.map((e) => {
        if (toUpdate.some((u) => u.id === e.id)) {
            // invalidate versionNonce to put it to the history
            return { ...e, ...updateFn(e), versionNonce: e.versionNonce + 1 } as ExcalidrawElement;
        }
        return e;
    });
    return api.updateScene({
        elements: restoreFn(elements, all, { refreshDimensions: true, repairBindings: true }),
        captureUpdate: 'IMMEDIATELY'
    });
};

export default restoreElementsWith;
