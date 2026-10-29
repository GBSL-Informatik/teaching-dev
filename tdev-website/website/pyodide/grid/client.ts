import { defineClientExtension } from '@tdev/pyodide-code/extensions';
import GridStore from './GridStore';
import type { GridFrame } from './protocol';

export default defineClientExtension<GridFrame, GridStore>({
    createStore: (context) => new GridStore(context),
    handleMessage: (store, { targetId, payload }) => {
        store.useGrid(targetId).setFrame(payload);
    }
});
