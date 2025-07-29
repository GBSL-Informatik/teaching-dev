import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';

const updateElementsWith = (
    api: ExcalidrawImperativeAPI,
    toUpdate: { id: string }[],
    updateFn: (e: ExcalidrawElement) => Partial<ExcalidrawElement>
) => {
    const elements = api.getSceneElementsIncludingDeleted();
    return api.updateScene({
        elements: elements.map((e) => {
            if (toUpdate.some((u) => u.id === e.id)) {
                // invalidate versionNonce to put it to the history
                return { ...e, ...updateFn(e), versionNonce: e.versionNonce + 1 } as ExcalidrawElement;
            }
            return e;
        }),
        captureUpdate: 'IMMEDIATELY'
    });
};

export default updateElementsWith;
