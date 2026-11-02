import { defineClientExtension } from '@tdev/pyodide-code/extensions';
import type { SceneSnapshot } from './protocol';
import SceneStore from './src/stores/SceneStore';

export default defineClientExtension<SceneSnapshot, SceneStore>({
    createStore: (context) => new SceneStore(context),
    handleMessage: (store, { targetId, payload }) => {
        store.useScene(targetId).setSnapshot(payload);
    }
});
