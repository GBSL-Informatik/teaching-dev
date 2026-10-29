import { defineClientExtension } from '@tdev/pyodide-code/extensions';
import type { GridFrame } from './protocol';
import GridStore from './src/stores/GridStore';

export default defineClientExtension<GridFrame, GridStore>({
    createStore: (context) => new GridStore(context),
    handleMessage: (store, { targetId, payload }) => {
        store.useGrid(targetId).setFrame(payload);
    }
});
