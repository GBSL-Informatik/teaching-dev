import type { ClientContext } from '@tdev/pyodide-code/extensions';
import { action, observable } from 'mobx';
import Scene from '../models/Scene';

export default class SceneStore {
    readonly context: ClientContext;
    readonly scenes = observable.map<string, Scene>([], { deep: false });

    constructor(context: ClientContext) {
        this.context = context;
    }

    @action
    useScene(id: string): Scene {
        const existingScene = this.scenes.get(id);
        if (existingScene) {
            return existingScene;
        }
        const scene = new Scene(id, this);
        this.scenes.set(id, scene);
        return scene;
    }
}
