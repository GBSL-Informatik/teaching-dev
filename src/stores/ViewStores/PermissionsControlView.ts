import { DocumentType } from '@tdev-api/document';
import { RootStore } from '@tdev-stores/rootStore';
import { orderBy } from 'es-toolkit/array';
import { action, computed, observable } from 'mobx';

export class PermissionsControlView {
    readonly root: RootStore;
    typeFilter = observable.set<DocumentType>(['solution']);
    @observable accessor pathFilter = '';

    constructor(root: RootStore) {
        this.root = root;
    }

    @action
    setPathFilter(path: string) {
        this.pathFilter = path;
    }

    @computed
    get pageIndex() {
        if (!this.pathFilter) {
            return this.root.pageStore._pageIndex;
        }
        const filter = new RegExp(this.pathFilter, 'i');
        return this.root.pageStore._pageIndex.filter((p) => filter.test(p.path));
    }

    @computed
    get documentTypes() {
        const types = new Set<DocumentType>();
        for (const page of Object.values(this.root.pageStore._pageIndex)) {
            types.add(page.type);
        }
        return Array.from(types);
    }

    @computed
    get selectTypeOptions() {
        return orderBy(
            this.documentTypes.map((type, idx) => ({
                value: type,
                label: type,
                hslDeg: (idx / this.documentTypes.length) * 360
            })),
            ['label'],
            ['asc']
        );
    }

    @action
    setTypeFilter(type: DocumentType, enabled: boolean) {
        if (enabled) {
            this.typeFilter.add(type);
        } else {
            this.typeFilter.delete(type);
        }
    }

    @computed
    get filteredDocumentRoots() {
        return this.relevantDocumentRootIds.length;
    }

    @computed
    get totalDocumentRoots() {
        const total = new Set<string>(this.root.pageStore._pageIndex.map((p) => p.id));
        return total.size;
    }

    @action
    clearTypeFilter() {
        this.typeFilter.clear();
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
    selectAllTypeFilters() {
        this.typeFilter.replace(this.documentTypes);
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
