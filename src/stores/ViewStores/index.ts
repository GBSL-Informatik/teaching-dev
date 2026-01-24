import { ViewStoreType, ViewStore as ViewStores, ViewStoreTypeMapping } from '@tdev-api/document';
import { RootStore } from '@tdev-stores/rootStore';

export interface ViewStoreProps<T extends ViewStoreType = ViewStoreType> {
    store: ViewStoreTypeMapping[T];
}

export default class ViewStore {
    readonly root: RootStore;
    stores = new Map<ViewStoreType, ViewStores>();
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
}
