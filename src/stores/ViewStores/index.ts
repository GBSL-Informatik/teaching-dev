import { ViewStoreType, ViewStore as ViewStores, ViewStoreTypeMapping } from '@tdev-api/document';
import { RootStore } from '@tdev-stores/rootStore';
import { action, computed, observable, observableRef } from 'mobx';
import { PermissionsControlView } from './PermissionsControlView';

export interface ViewStoreProps<T extends ViewStoreType = ViewStoreType> {
    store: ViewStoreTypeMapping[T];
}

export default class ViewStore {
    readonly root: RootStore;
    stores = new Map<ViewStoreType, ViewStores>();
    @observableRef accessor permissionControl: PermissionsControlView = null as any;
    @observable accessor fullscreenTargetId: string | null = null;
    @observable accessor isPageVisible: boolean = true;
    @observable accessor _presentationPanelState: null | 'open' | 'closed' = null;
    @observable accessor isPresentedEditorZoomed: boolean = false;

    constructor(store: RootStore) {
        this.root = store;
        this.permissionControl = new PermissionsControlView(store);
    }

    @action
    setIsPresentedEditorZoomed(zoomed: boolean) {
        this.isPresentedEditorZoomed = zoomed;
    }

    @action
    setPresentationPanelState(state: 'open' | 'closed' | null) {
        this._presentationPanelState = state;
    }

    @computed
    get presentationPanelState() {
        if (!this.root.userStore.current?.hasElevatedAccess) {
            return 'open';
        }
        return this._presentationPanelState ?? ' open';
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
    setPageVisibility(visible: boolean) {
        this.isPageVisible = visible;
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

    isFullscreenTarget(targetId: string | null) {
        if (!targetId) {
            return false;
        }
        return this.fullscreenTargetId === targetId;
    }
}
