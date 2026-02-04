import { action, computed, observable, transaction } from 'mobx';
import iStore from '@tdev-stores/iStore';
import { RootStore } from '@tdev-stores/rootStore';
import Page from '@tdev-models/Page';
import { computedFn } from 'mobx-utils';
import { allDocuments as apiAllDocuments, DocumentType } from '@tdev-api/document';
import type { GlobalPluginData } from '@docusaurus/plugin-content-docs/client';
import siteConfig from '@generated/docusaurus.config';
import { PageIndex } from '@tdev/page-progress-state';
import { groupBy } from 'es-toolkit/array';
import globalData from '@generated/globalData';
const ensureTrailingSlash = (str: string) => {
    return str.endsWith('/') ? str : `${str}/`;
};
export const AUTO_GENERATED_PAGE_PREFIX = '__auto_generated__';
export const SidebarVersions = (
    globalData['docusaurus-plugin-content-docs'].default as GlobalPluginData
).versions.map((version) => {
    const versionPath = ensureTrailingSlash(version.path);
    const slashCount = version.path.split('/').length + 1;
    const rdocs = version.docs.filter(
        (doc) =>
            doc.path.startsWith(version.path) && doc.path.replace(/\/$/, '').split('/').length === slashCount
    );
    return {
        name: version.name,
        rootPaths: rdocs.map((doc) => ensureTrailingSlash(doc.path)),
        versionPath: versionPath
    };
});

const getPathTree = (pagePath: string) => {
    const parts = pagePath.split('/').filter((p) => p.length > 0);
    return parts.map((_, idx) => {
        return `/${parts.slice(0, idx + 1).join('/')}/`;
    });
};

interface PagesIndex {
    documentRoots: PageIndex[];
}

export class PageStore extends iStore {
    readonly root: RootStore;

    pages = observable<Page>([]);

    @observable accessor currentPageId: string | undefined = undefined;
    @observable accessor runningTurtleScriptId: string | undefined = undefined;

    @observable.ref accessor _pageIndex: PageIndex[] = [];

    constructor(store: RootStore) {
        super();
        this.root = store;
    }

    get sidebarVersions() {
        return SidebarVersions;
    }

    @computed
    get landingPages() {
        return this.pages.filter((page) => page.isLandingpage);
    }

    @computed
    get tree() {
        return SidebarVersions.map((version) => {
            return {
                version: version.name,
                path: version.versionPath,
                pages: version.rootPaths.map((rootPath) => {
                    const rootLandingPage = this.pages.find((page) => page.path === rootPath);
                    console.log(
                        'Looking for landing page for root path',
                        rootPath,
                        rootLandingPage,
                        this.pages.map((p) => p.path)
                    );
                    if (rootLandingPage) {
                        console.log('Found landing page for root path', rootPath);
                        return {
                            version: version.name,
                            path: rootPath,
                            pages: [rootLandingPage.tree]
                        };
                    }
                    const pages = this.pages.filter((page) => page.parentPath === rootPath);
                    return {
                        version: version.name,
                        path: rootPath,
                        pages: pages.map((page) => page.tree)
                    };
                })
            };
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
                    const pages = Object.values(grouped).map((docRootDescriptors) => {
                        const doc = docRootDescriptors[0]!;
                        const page = new Page(doc.page_id, doc.path, this);
                        docRootDescriptors
                            .filter((doc) => doc.position > 0)
                            .forEach((d) => page.addDocumentRootConfig(d.id, d));
                        return page;
                    });
                    const addedPaths = new Set<string>(pages.map((p) => p.path));
                    const fullTree = new Set<string>(pages.flatMap((p) => getPathTree(p.path)));
                    const missingPaths = Array.from(fullTree).filter((p) => !addedPaths.has(p));
                    missingPaths.forEach((path) => {
                        const page = new Page(`${AUTO_GENERATED_PAGE_PREFIX}${path}`, path, this);
                        pages.push(page);
                    });
                    this.pages.replace(pages);
                    this._pageIndex = data.documentRoots;
                })
            )
            .then(() => {
                this.loadTaskableDocuments();
            })
            .catch((err) => {
                console.error('Failed to load page index', err);
            });
    }

    @action
    loadTaskableDocuments() {
        this.pages.forEach((page) => {
            page.taskableDocumentRootIds.forEach((id) => {
                this.root.documentRootStore.loadInNextBatch(id, undefined, {
                    skipCreate: true,
                    documentRoot: 'addIfMissing'
                });
            });
        });
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
            return apiAllDocuments([...page.documentRootConfigs.keys()], sig.signal).then(({ data }) => {
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
