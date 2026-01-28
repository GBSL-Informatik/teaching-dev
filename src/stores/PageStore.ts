import { action, computed, observable, transaction } from 'mobx';
import iStore from '@tdev-stores/iStore';
import { RootStore } from '@tdev-stores/rootStore';
import Page from '@tdev-models/Page';
import { computedFn } from 'mobx-utils';
import { allDocuments as apiAllDocuments, DocumentType } from '@tdev-api/document';
import type { useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import siteConfig from '@generated/docusaurus.config';
import { PageIndex } from '@tdev/page-progress-state';
import { groupBy } from 'es-toolkit/array';

interface PagesIndex {
    documentRoots: PageIndex[];
}

export class PageStore extends iStore {
    readonly root: RootStore;

    pages = observable<Page>([]);

    @observable accessor currentPageId: string | undefined = undefined;
    @observable accessor runningTurtleScriptId: string | undefined = undefined;

    @observable.ref accessor _pageIndex: PageIndex[] = [];
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
    loadPageIndex(force: boolean = false) {
        if (!force && this._pageIndex.length > 0) {
            return Promise.resolve();
        }
        return fetch(`${siteConfig.baseUrl}tdev-artifacts/page-progress-state/pageIndex.json`)
            .then((res) => {
                return res.json() as Promise<PagesIndex>;
            })
            .then(
                action((data) => {
                    const grouped = groupBy(data.documentRoots, (dr) => `${dr.path}::${dr.page_id}`);
                    const pages = Object.values(grouped).map((docs) => {
                        const doc = docs[0]!;
                        const page = new Page(doc.page_id, doc.path, this);
                        docs.forEach((d) => page.addDocumentRootId(d.id));
                        return page;
                    });
                    this.pages.replace(pages);
                    this.setPageIndex(data.documentRoots);
                })
            )
            .catch((err) => {
                console.error('Failed to load page index', err);
            });
    }

    @action
    setPageIndex(newIndex: PageIndex[]) {
        this._pageIndex = newIndex;
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

    // @action
    // addToStore(page: Page) {
    //     const old = this.find(page.id);
    //     if (old) {
    //         this.pages.remove(old);
    //     }
    //     this.pages.push(page);
    // }

    @action
    addIfNotPresent(id: string, makeCurrent?: boolean) {
        if (!this.find(id)) {
            if (process.env.NODE_ENV !== 'production') {
                this.loadPageIndex(true);
            }
            const page = new Page(id, window.location.pathname, this);
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
