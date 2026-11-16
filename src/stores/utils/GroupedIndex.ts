import { action, IObservableArray, observable } from 'mobx';

const EMPTY_GROUP: readonly never[] = Object.freeze([]);

/**
 * Observable secondary index that groups the models of a store by a key, e.g. documents by their
 * document root id. Observers of a group only re-run when that group changes.
 *
 * The key of a model must not change while the model is indexed.
 */
class GroupedIndex<T> {
    readonly groups = observable.map<string, IObservableArray<T>>([], { deep: false });

    get(key?: string | null): readonly T[] {
        if (!key) {
            return EMPTY_GROUP;
        }
        return this.groups.get(key) ?? EMPTY_GROUP;
    }

    @action
    add(key: string | null | undefined, item: T) {
        if (!key) {
            return;
        }
        const group = this.groups.get(key);
        if (group) {
            group.push(item);
            return;
        }
        this.groups.set(key, observable.array([item], { deep: false }));
    }

    @action
    remove(key: string | null | undefined, item: T) {
        if (!key) {
            return;
        }
        const group = this.groups.get(key);
        if (!group) {
            return;
        }
        group.remove(item);
        if (group.length === 0) {
            this.groups.delete(key);
        }
    }

    @action
    clear() {
        this.groups.clear();
    }
}

export default GroupedIndex;
