import { ViewStoreType, ViewStore as ViewStores, ViewStoreTypeMapping } from '@tdev-api/document';
import { RootStore } from '@tdev-stores/rootStore';
import { action, computed, observable } from 'mobx';

export interface ViewStoreProps<T extends ViewStoreType = ViewStoreType> {
    store: ViewStoreTypeMapping[T];
}

export default class ViewStore {
    readonly root: RootStore;
    stores = new Map<ViewStoreType, ViewStores>();
    @observable accessor fullscreenTargetId: string | null = null;
    constructor(store: RootStore) {
        this.root = store;
    }

    useStore<T extends ViewStoreType>(type: T): ViewStoreTypeMapping[T] {
        return this.stores.get(type) as ViewStoreTypeMapping[T];
    }

    registerStore<T extends ViewStoreType>(
        type: T,
        store: (viewStore: ViewStore) => ViewStoreTypeMapping[T]
    ) {
        this.stores.set(type, store(this));
    }

    @action
    requestFullscreen(targetId: string) {
        if (this.fullscreenTargetId === targetId) {
            return;
        }
        const element = document.getElementById(targetId);
        if (!element) {
            return;
        }
        element.requestFullscreen?.().then(
            action(() => {
                this.setFullscreenTargetId(targetId);
            })
        );
    }

    @action
    exitFullscreen() {
        if (!this.fullscreenTargetId) {
            return;
        }
        document.exitFullscreen?.().then(
            action(() => {
                this.setFullscreenTargetId(null);
            })
        );
    }

    @action
    setFullscreenTargetId(id: string | null) {
        if (id === this.fullscreenTargetId) {
            return;
        }
        this.fullscreenTargetId = id;
    }

    @computed
    get isFullscreen() {
        return this.fullscreenTargetId !== null;
    }

    isFullscreenTarget(targetId: string) {
        return this.fullscreenTargetId === targetId;
    }
}
