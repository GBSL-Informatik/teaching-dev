import { ViewStore as ViewStores, ViewStoreType, ViewStoreTypeMapping } from '@tdev-api/document';
import type File from '@tdev-models/documents/FileSystem/File';
import type { RootStore } from '@tdev-stores/rootStore';
import { action, computed, observable, observableRef } from 'mobx';
import { AdminView } from './AdminView';
import { PermissionsControlView } from './PermissionsControlView';

export interface ViewStoreProps<T extends ViewStoreType = ViewStoreType> {
    store: ViewStoreTypeMapping[T];
}

export const FILE_TREE_DEFAULT_WIDTH = 240;
export const FILE_TREE_MIN_WIDTH = 120;

export default class ViewStore {
    readonly root: RootStore;
    stores = new Map<ViewStoreType, ViewStores>();
    @observableRef accessor permissionControl: PermissionsControlView = null as any;
    @observableRef accessor adminView: AdminView = null as any;
    @observable accessor fullscreenTargetId: string | null = null;
    @observable accessor isPageVisible: boolean = true;
    @observable accessor _presentationPanelState: null | 'open' | 'closed' = null;
    @observable accessor isPresentedEditorZoomed: boolean = false;
    selectedFileIds = observable.map<string, string>();
    fileTreeWidths = observable.map<string, number>();
    mobileFileTreeExpanded = observable.map<string, boolean>();

    constructor(store: RootStore) {
        this.root = store;
        this.permissionControl = new PermissionsControlView(store);
        this.adminView = new AdminView(store);
    }

    @action
    setSelectedFile(rootId: string, fileId: string | null) {
        if (fileId === null) {
            this.selectedFileIds.delete(rootId);
            this.mobileFileTreeExpanded.delete(rootId);
        } else {
            this.selectedFileIds.set(rootId, fileId);
            this.mobileFileTreeExpanded.set(rootId, false);
        }
    }

    getSelectedFile(rootId?: string): File | undefined {
        if (!rootId) {
            return;
        }
        const file = this.root.documentStore.find(this.selectedFileIds.get(rootId));
        if (file?.type !== 'file' || file.rootDir?.id !== rootId) {
            return;
        }
        return file;
    }

    getFileTreeWidth(rootId: string) {
        return this.fileTreeWidths.get(rootId) ?? FILE_TREE_DEFAULT_WIDTH;
    }

    isMobileFileTreeExpanded(rootId: string) {
        return this.mobileFileTreeExpanded.get(rootId) ?? !this.getSelectedFile(rootId);
    }

    @action
    setMobileFileTreeExpanded(rootId: string, expanded: boolean) {
        this.mobileFileTreeExpanded.set(rootId, expanded);
    }

    isFileTreeCollapsed(rootId: string) {
        return this.getFileTreeWidth(rootId) === 0;
    }

    @action
    setFileTreeWidth(rootId: string, width: number, maxWidth = Infinity) {
        const nextWidth = Math.max(0, Math.min(width, maxWidth));
        this.fileTreeWidths.set(rootId, nextWidth < FILE_TREE_MIN_WIDTH ? 0 : nextWidth);
    }

    @action
    cleanup() {
        this.selectedFileIds.clear();
        this.fileTreeWidths.clear();
        this.mobileFileTreeExpanded.clear();
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
