import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';

const updateElementsWith = <T extends ExcalidrawElement>(
    api: ExcalidrawImperativeAPI,
    toUpdate: { id: string }[],
    updateFn: (e: T) => Partial<T>
) => {
    const elements = api.getSceneElementsIncludingDeleted();
    const updateIds = new Set(toUpdate.map((u) => u.id));
    return api.updateScene({
        elements: elements.map((e) => {
            if (updateIds.has(e.id)) {
                // invalidate versionNonce to put it to the history
                return { ...e, ...updateFn(e as T), versionNonce: e.versionNonce + 1 } as T;
            }
            return e;
        }),
        captureUpdate: 'IMMEDIATELY'
    });
};

export default updateElementsWith;
