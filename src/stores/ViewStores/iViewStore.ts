import iStore from '@tdev-stores/iStore';

export default class iViewStore<Store extends iStore<any>> {
    readonly store: Store;
    constructor(parent: Store) {
        this.store = parent;
    }
    cleanup() {
        // noop
    }
}
