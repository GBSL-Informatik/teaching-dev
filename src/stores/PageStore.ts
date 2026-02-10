import { action, computed, observable, reaction, transaction } from 'mobx';
import iStore from '@tdev-stores/iStore';
import { RootStore } from '@tdev-stores/rootStore';
import Page from '@tdev-models/Page';
import { computedFn } from 'mobx-utils';
import { allDocuments as apiAllDocuments, DocumentType } from '@tdev-api/document';
import type { GlobalPluginData } from '@docusaurus/plugin-content-docs/client';
import siteConfig from '@generated/docusaurus.config';
import { PageIndex } from '@tdev/page-index';
import { groupBy } from 'es-toolkit/array';
import globalData from '@generated/globalData';
const ensureTrailingSlash = (str: string) => {
    return str.endsWith('/') ? str : `${str}/`;
};
const ensureLeadingSlash = (str: string) => {
    return str.startsWith('/') ? str : `/${str}`;
};
const BasePathRegex = new RegExp(`^${siteConfig.baseUrl}`, 'i');
export const AUTO_GENERATED_PAGE_PREFIX = '__auto_generated__';
export const SidebarVersions = (
    globalData['docusaurus-plugin-content-docs'].default as GlobalPluginData
).versions.map((version) => {
    const versionPath = ensureTrailingSlash(version.path);
    const slashCount = version.path.split('/').length + 1;
    const rdocs = version.docs.filter((doc) => {
        if (version.mainDocId === 'index' && doc.id === version.mainDocId) {
            return true;
        }
        return (
            doc.path.startsWith(version.path) && doc.path.replace(/\/$/, '').split('/').length === slashCount
        );
    });
    return {
        name: version.name,
        rootPaths: rdocs.map((doc) => ensureTrailingSlash(doc.path)),
        versionPath: versionPath
    };
});

const isDocumentationPage = !!SidebarVersions.find((version) => version.versionPath === '/');
const DocsPathRegex = isDocumentationPage ? /^\/docs\// : /^\//;

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

    pages = observable<Page>([], { deep: false });

    @observable accessor currentPageId: string | undefined = undefined;
    @observable accessor runningTurtleScriptId: string | undefined = undefined;

    @observable.ref accessor _pageIndex: PageIndex[] = [];
    @observable accessor currentPath: string | undefined = undefined;
    loadedPageIndices = new Set<string>();

    constructor(store: RootStore) {
        super();
        this.root = store;
        reaction(
            () => this.root.userStore.viewedUserId,
            (userId) => {
                if (userId) {
                    this.loadedPageIndices.clear();
                    this.loadTaskableDocuments(this.currentStudentGroupName);
                }
            }
        );
    }

    get sidebarVersions() {
        return SidebarVersions;
    }

    @computed
    get sidebarVersionPaths() {
        return new Set(SidebarVersions.map((version) => version.versionPath));
    }

    @computed
    get landingPages() {
        return this.pages.filter((page) => page.isLandingpage);
    }

    @computed
    get isPageIndexLoaded() {
        return this._pageIndex.length > 0;
    }

    @action
    loadPageIndex(force: boolean = false) {
        if (!force && this.isPageIndexLoaded) {
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
                        const path = doc.path.replace(DocsPathRegex, '/');
                        const page = new Page(doc.page_id, path, this);
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
                if (this.currentPath) {
                    this.loadTaskableDocuments(this.currentStudentGroupName);
                }
            })
            .catch((err) => {
                console.error('Failed to load page index', err);
            });
    }

    @action
    setCurrentPath(path: string | undefined) {
        const normalizedPath = path?.replace(BasePathRegex, '/');
        if (normalizedPath === this.currentPath) {
            return;
        }
        if (!normalizedPath) {
            this.currentPath = undefined;
            return;
        }
        this.currentPath = normalizedPath;
        if (this.isPageIndexLoaded) {
            this.loadTaskableDocuments(this.currentStudentGroupName);
        }
        this.resetPagesStudentGroups();
    }

    @action
    resetPagesStudentGroups() {
        this.pages
            .filter((p) => p.hasCustomPrimaryStudentGroup)
            .forEach((p) => p.setPrimaryStudentGroupName(undefined));
    }

    @computed
    get currentPathParts() {
        if (!this.currentPath) {
            return [];
        }
        return this.currentPath.split('/').filter((p) => p.length > 0);
    }

    @computed
    get currentStudentGroupName() {
        const name = this.currentPathParts[0];
        if (this.sidebarVersionPaths.has(`/${name}/`)) {
            return name;
        }
        // don't load an index on the start page.
        if (this.currentPath === '/') {
            return undefined;
        }
        return '/';
    }

    @action
    loadTaskableDocuments(pathPrefix: string | undefined, force?: boolean) {
        if (!pathPrefix || !this.isPageIndexLoaded) {
            return;
        }
        const prefix = ensureLeadingSlash(ensureTrailingSlash(pathPrefix));
        const isVersion =
            prefix === '/'
                ? (p: string) => {
                      if (p === '/') {
                          return true;
                      }
                      const name = `/${p.split('/')[1]}/`;
                      return !this.sidebarVersionPaths.has(name);
                  }
                : (p: string) => p.startsWith(prefix);
        const isEntryPoint = this.sidebarVersionPaths.has(prefix);
        if (!isEntryPoint) {
            return;
        }
        if (!force && this.loadedPageIndices.has(prefix)) {
            return;
        }
        this.loadedPageIndices.add(prefix);
        this.pages
            .filter((p) => isVersion(p.path) && !p.isAutoGenerated)
            .forEach((page) => {
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
            const pages = this.pages.filter((p) => p.id === id);
            if (pages.length <= 1) {
                return pages[0];
            }
            return pages.find((p) => p.studentGroupName === this.currentStudentGroupName) || pages[0];
        },
        { keepAlive: true }
    );

    @computed
    get current(): Page | undefined {
        const currentPath = this.find(this.currentPageId);
        if (currentPath || !this.currentPath) {
            return currentPath;
        }
        const byPath = this.pages.find((p) => p.path === this.currentPath);
        return byPath;
    }

    @action
    addIfNotPresent(id: string, makeCurrent?: boolean) {
        if (!this.find(id)) {
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
