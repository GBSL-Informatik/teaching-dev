import { action, computed, observable, transaction } from 'mobx';
import iStore from '@tdev-stores/iStore';
import { RootStore } from '@tdev-stores/rootStore';
import Page from '@tdev-models/Page';
import { computedFn } from 'mobx-utils';
import { allDocuments as apiAllDocuments, DocumentType } from '@tdev-api/document';
import type { useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import { PropSidebarItem } from '@docusaurus/plugin-content-docs';
type PageIndex = { [key: string]: string[] };

export class PageStore extends iStore {
    readonly root: RootStore;

    pages = observable<Page>([]);

    @observable accessor currentPageId: string | undefined = undefined;
    @observable accessor runningTurtleScriptId: string | undefined = undefined;

    @observable.ref accessor pageIndex: PageIndex = {};
    sidebars = observable.map<string, ReturnType<typeof useDocsSidebar>>([], { deep: false });

    constructor(store: RootStore) {
        super();
        this.root = store;
    }

    @action
    configureSidebar(id: string, sidebar: ReturnType<typeof useDocsSidebar>) {
        if (this.sidebars.has(id) || !sidebar) {
            return;
        }
        this.sidebars.set(id, sidebar);
        sidebar.items.forEach((item) => {
            if (item.type !== 'category') {
                return;
            }
            item.items;
        });
    }

    @action
    load() {
        return import('@tdev/page-progress-state/assets/index.json').then((mod) => {
            this.updatePageIndex(mod.default as PageIndex);
        });
    }

    @action
    updatePageIndex(newIndex: PageIndex) {
        this.pageIndex = newIndex;
    }

    find = computedFn(
        function (this: PageStore, id?: string): Page | undefined {
            if (!id) {
                return;
            }
            return this.pages.find((d) => d.id === id) as Page;
        },
        { keepAlive: true }
    );

    @computed
    get current(): Page | undefined {
        return this.find(this.currentPageId);
    }

    @action
    addToStore(page: Page) {
        const old = this.find(page.id);
        if (old) {
            this.pages.remove(old);
        }
        this.pages.push(page);
    }

    @action
    addIfNotPresent(id: string, makeCurrent?: boolean) {
        if (!this.find(id)) {
            const page = new Page(id, this);
            this.pages.push(page);
        }
        if (makeCurrent) {
            this.setCurrentPageId(id);
        }
    }

    @action
    setCurrentPageId(pageId: string | undefined) {
        this.currentPageId = pageId;
    }

    @action
    loadAllDocuments(page: Page) {
        return this.withAbortController(`load-all-${page.id}`, (sig) => {
            return apiAllDocuments([...page.documentRootIds], sig.signal).then(({ data }) => {
                return transaction(() => {
                    return data.map((doc) => {
                        return this.root.documentStore.addToStore<DocumentType>(doc);
                    });
                });
            });
        });
    }

    @action
    setRunningTurtleScriptId(id: string | undefined) {
        this.runningTurtleScriptId = id;
    }
}
