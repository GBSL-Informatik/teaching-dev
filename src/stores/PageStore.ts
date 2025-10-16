import { action, computed, observable } from 'mobx';
import iStore from '@tdev-stores/iStore';
import { RootStore } from '@tdev-stores/rootStore';
import Page from '@tdev-models/Page';
import { computedFn } from 'mobx-utils';
import { allDocuments as apiAllDocuments } from '@tdev-api/document';

export class PageStore extends iStore {
    readonly root: RootStore;

    pages = observable<Page>([]);

    @observable accessor currentPageId: string | undefined = undefined;
    @observable accessor runningTurtleScriptId: string | undefined = undefined;

    constructor(store: RootStore) {
        super();
        this.root = store;
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
                return Promise.all(
                    data.map((doc) => {
                        this.root.documentStore.addToStore(doc);
                    })
                );
            });
        });
    }

    @action
    setRunningTurtleScriptId(id: string | undefined) {
        this.runningTurtleScriptId = id;
    }
}
