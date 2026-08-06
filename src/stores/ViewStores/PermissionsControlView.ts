import { DocumentType } from '@tdev-api/document';
import { RootStore } from '@tdev-stores/rootStore';
import { action, computed, observable } from 'mobx';

export class PermissionsControlView {
    readonly root: RootStore;
    _typeFilter = observable.set<DocumentType>(['solution']);

    constructor(root: RootStore) {
        this.root = root;
    }

    @computed
    get pageIndex() {
        return this.root.pageStore._pageIndex;
    }

    @computed
    get documentTypes() {
        const types = new Set<DocumentType>();
        for (const page of Object.values(this.root.pageStore._pageIndex)) {
            types.add(page.type);
        }
        return Array.from(types).sort();
    }

    @computed
    get typeFilter() {
        if (this._typeFilter.size === 0) {
            return new Set(this.documentTypes);
        }
        return this._typeFilter;
    }

    @action
    setTypeFilter(type: DocumentType, enabled: boolean) {
        if (enabled) {
            this._typeFilter.add(type);
        } else {
            this._typeFilter.delete(type);
        }
    }

    @computed
    get relevantDocumentRootIds() {
        const ids = new Set<string>();
        for (const docs of Object.values(this.docsTree)) {
            docs.forEach((doc) => ids.add(doc.id));
        }
        return Array.from(ids);
    }

    @action
    toggleTypeFilter(type: DocumentType) {
        this.setTypeFilter(type, !this._typeFilter.has(type));
    }

    @computed
    get docsTree() {
        const tree: Record<string, { id: string; type: DocumentType; pageId: string; position: number }[]> =
            {};
        this.pageIndex.forEach((page) => {
            if (!this.typeFilter.has(page.type)) {
                return;
            }
            if (!tree[page.path]) {
                tree[page.path] = [];
            }
            tree[page.path].push({
                id: page.id,
                type: page.type,
                pageId: page.page_id,
                position: page.position
            });
        });

        return tree;
    }

    @computed
    get typeColors() {
        const n = this.documentTypes.length;
        const colors: Map<DocumentType, string> = new Map();
        this.documentTypes.forEach((type, idx) => {
            const hue = (idx / n) * 360;
            colors.set(type, `hsl(${hue}, 70%, 50%)`);
        });
        return colors;
    }
}
