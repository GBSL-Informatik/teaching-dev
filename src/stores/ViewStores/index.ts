import { ViewStoreType, ViewStore as ViewStores, ViewStoreTypeMapping } from '@tdev-api/document';

export interface ViewStoreProps<T extends ViewStoreType = ViewStoreType> {
    store: ViewStoreTypeMapping[T];
}

export default class ViewStore {
    stores = new Map<ViewStoreType, ViewStores>();

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
