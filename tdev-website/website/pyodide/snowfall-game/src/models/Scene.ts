import type { EventSource } from '@tdev/pyodide-code/events';
import { action, computed, observableRef } from 'mobx';
import { DEFAULT_SCENE_CONFIGURATION, type SceneSnapshot } from '../../protocol';
import type SceneStore from '../stores/SceneStore';

export default class Scene {
    readonly id: string;
    readonly store: SceneStore;
    readonly eventSource: EventSource;
    @observableRef accessor snapshot: SceneSnapshot = {
        ...DEFAULT_SCENE_CONFIGURATION,
        snowflakes: [],
        dots: []
    };

    constructor(id: string, store: SceneStore) {
        this.id = id;
        this.store = store;
        this.eventSource = { extension: store.context.name, targetId: id };
    }

    @computed
    get isConnected(): boolean {
        return this.store.context.events.isConnected(this.eventSource);
    }

    @action
    setSnapshot(snapshot: SceneSnapshot) {
        this.snapshot = snapshot;
    }

    handleClick(x: number, y: number) {
        void this.store.context.events.emit(this.eventSource, { type: 'click', payload: { x, y } });
    }

    handleKey(key: string) {
        void this.store.context.events.emit(this.eventSource, { type: 'key', payload: { key } });
    }
}
