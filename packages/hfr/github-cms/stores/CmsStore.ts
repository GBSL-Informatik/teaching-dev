import siteConfig from '@generated/docusaurus.config';
import {
    logout as apiGithubLogout,
    githubToken as apiGithubToken,
    load as apiLoadSettings,
    CmsSettings,
    FullCmsSettings
} from '@tdev-api/cms';
import { trimSlashes } from '@tdev-models/helpers/trimSlashes';
import iStore, { ApiState } from '@tdev-stores/iStore';
import { RootStore } from '@tdev-stores/rootStore';
import ViewStore from '@tdev-stores/ViewStores';
import imageCompression from 'browser-image-compression';
import _ from 'es-toolkit/compat';
import { action, computed, observable, observableRef, reaction } from 'mobx';
import { computedFn } from 'mobx-utils';
import BinFile from '../models/BinFile';
import { type CmsLocation, SITE_REPOSITORY } from '../models/cmsLocation';
import Dir from '../models/Dir';
import { default as FileModel } from '../models/File';
import FileStub from '../models/FileStub';
import Github from '../models/Github';
import iEntry from '../models/iEntry';
import iFile from '../models/iFile';
import PartialSettings from '../models/PartialSettings';
import Settings from '../models/Settings';
import { DraftStore } from './DraftStore';
import { default as CmsViewStore } from './ViewStore';
import { VisitStore } from './VisitStore';

const { organizationName, projectName } = siteConfig;
if (!organizationName || !projectName) {
    throw new Error('"organizationName" and "projectName" must be set in docusaurus.config.ts');
}

/** a navigation requested by the store, applied to the url by `useRequestedNavigation` */
export interface NavigationRequest {
    location: CmsLocation;
    /** e.g. to replace an invalid location in the history */
    replace: boolean;
}

export class CmsStore extends iStore<'logout' | `load-settings` | `load-token`> {
    readonly rootViewStore: ViewStore;
    @observable accessor repoOwner: string = organizationName!;
    @observable accessor repoName: string = projectName!;
    @observableRef accessor settings: Settings | undefined;
    @observableRef accessor partialSettings: PartialSettings | undefined;
    @observableRef accessor github: Github | undefined;
    @observableRef accessor viewStore: CmsViewStore;
    readonly drafts: DraftStore;
    readonly visits = new VisitStore();

    @observable accessor initialized = false;
    @observableRef accessor requestedNavigation: NavigationRequest | undefined = undefined;
    /** the location of the url, see `open` */
    @observable accessor activeBranchName: string | undefined = undefined;
    @observable accessor activeFilePath = '';

    constructor(store: ViewStore) {
        super();
        this.viewStore = new CmsViewStore(this);
        this.rootViewStore = store;
        this.drafts = new DraftStore(this);
        reaction(
            () => [this.repoKey, this.activeBranchName, this.github] as const,
            ([repo, branch, github]) => {
                if (branch && github) {
                    github.fetchDirectory(branch).catch((err) => {
                        console.log(`invalid branch ${branch}, opening the default branch`, err);
                        this.handleInvalidBranch(repo, branch);
                    });
                }
            }
        );
        reaction(
            () => [this.repoKey, this.activeBranchName, this.activeFilePath, this.github] as const,
            ([repo, branch, path, github]) => {
                if (path && branch && github) {
                    const dummy = FileStub.DummyFile(path, branch, this, false);
                    this.fetchFile(dummy).then(() => {
                        if (dummy.apiState === ApiState.ERROR) {
                            this.handleInvalidPath(repo, branch, path);
                        }
                    });
                }
            }
        );
        reaction(
            () => this.settings?.token,
            action((token) => {
                if (token) {
                    this._initializeGithub();
                }
            })
        );
    }

    get root(): RootStore {
        return this.rootViewStore.root;
    }

    @computed
    get repoKey() {
        return `${this.repoOwner}/${this.repoName}`;
    }

    /**
     * Opens the location of the url and remembers it, also before the login.
     * A location without a branch is redirected to the default branch, see `CmsRoute`.
     */
    @action
    open(location: CmsLocation) {
        this.configureRepo(location.repo);
        this.visits.visit(location);
        if (!location.branch) {
            return;
        }
        this.activeBranchName = location.branch;
        this.activeFilePath = location.path;
        this.refreshTokenIfNeeded();
    }

    @action
    navigateTo(location: CmsLocation, replace = false) {
        this.requestedNavigation = { location, replace };
    }

    /** the default branch, once the repository is loaded */
    defaultBranchOf(repo: string) {
        if (repo !== this.repoKey) {
            return undefined;
        }
        return this.github?.defaultBranchName;
    }

    /** e.g. a repository without access: its visits are forgotten, the site's repository is opened */
    @action
    handleRepoNotFound(repo: string) {
        this.visits.forgetRepo(repo);
        if (repo !== this.repoKey || repo === SITE_REPOSITORY) {
            return;
        }
        this.navigateTo({ repo: SITE_REPOSITORY, path: '' }, true);
    }

    @action
    _initializeGithub() {
        if (!this.settings || this.settings.isExpired) {
            return;
        }
        this.github = new Github(this.settings.token, this);
        this.github.load();
    }

    @computed
    get userName() {
        return this.settings?.userId;
    }

    @action
    logoutGithub() {
        this.withAbortController(`logout`, (ct) => {
            return apiGithubLogout(ct.signal).then(
                action(({ data }) => {
                    this.handleSettingsChange(data);
                })
            );
        });
    }

    @action
    handleSettingsChange(data: Partial<CmsSettings>) {
        this.partialSettings = new PartialSettings(data as CmsSettings, this);
        if (data.token && data.tokenExpiresAt) {
            this.settings = new Settings(data as FullCmsSettings, this);
            return this.settings;
        } else {
            this.clearAccessToken();
        }
        return null;
    }

    @action
    fetchFile(fToLoad: iFile) {
        const github = this.github;
        if (!github) {
            return Promise.resolve(undefined);
        }
        return github.fetchFile(fToLoad).then((file) => {
            if (Array.isArray(file)) {
                // we loaded a directory, everything is fine...
            } else if (file && file.isFile()) {
                if (file.dir) {
                    return file.dir.fetchDirectory()?.then(() => file);
                } else {
                    return github.fetchDirectoryTree(file, true).then(() => {
                        return file;
                        // return file.dir?.fetchDirectory()?.then(() => file);
                    });
                }
            }
        });
    }

    @action
    clearAccessToken() {
        this.github = undefined;
        this.settings = undefined;
    }

    @action
    triggerNavigateToFile(branch: string, filePath?: string | null) {
        if (this.activeBranchName === branch && this.activeFilePath === (filePath || '')) {
            return;
        }
        this.navigateTo({ repo: this.repoKey, branch, path: filePath || '' });
    }

    @computed
    get activeBranch() {
        if (!this.activeBranchName) {
            return undefined;
        }
        return this.findBranch(this.activeBranchName);
    }

    @computed
    get canModifyActiveBranch() {
        if (this.root.userStore.current?.hasElevatedAccess) {
            return true;
        }
        return !this.isOnDefaultBranch;
    }

    @computed
    get isOnDefaultBranch() {
        return !!this.activeBranch?.isDefault;
    }

    @computed
    get branchEntries() {
        if (!this.activeBranchName || !this.github) {
            return [] as (Dir | FileModel)[];
        }
        return this.github.entries.get(this.activeBranchName) || [];
    }

    @computed
    get branchNames(): string[] {
        return this.github?.branches.map((b) => b.name) || [];
    }

    /**
     * all files belonging to the current branch and located at the root level
     */
    @computed
    get branchesRootEntries() {
        if (!this.settings) {
            return [];
        }
        return _.orderBy(
            this.branchEntries.filter((e) => e.level === 1) || [],
            ['type', 'name'],
            ['asc', 'asc']
        );
    }

    @computed
    get rootDir() {
        return this.findEntry<Dir>(this.activeBranchName, '/');
    }

    @action
    setBranch(name: string) {
        this.triggerNavigateToFile(name, this.activeFilePath);
    }

    @action
    fetchAccessToken(code: string) {
        return this.withAbortController(`load-token`, (ct) => {
            return apiGithubToken(code, ct.signal)
                .then(
                    action(({ data }) => {
                        if (data.token && data.tokenExpiresAt) {
                            this.settings = new Settings(data as FullCmsSettings, this);
                            return this.settings;
                        }
                        return null;
                    })
                )
                .catch((err) => {
                    console.error(err);
                    return null;
                });
        });
    }

    findEntry = computedFn(function <T = Dir | FileModel | BinFile | FileStub>(
        this: CmsStore,
        branch?: string,
        path?: string
    ): T | undefined {
        if (!path || !branch || !this.github?.entries.has(branch)) {
            return undefined;
        }
        const fPath = trimSlashes(path);
        return this.github.entries.get(branch)!.find((entry) => entry.path === fPath) as T;
    });

    findChildren = computedFn(function (this: CmsStore, branch: string, parentPath: string) {
        if (!this.github?.entries.has(branch)) {
            return [];
        }
        const refPath = trimSlashes(parentPath);
        return _.orderBy(
            this.github.entries.get(branch)!.filter((entry) => entry.parentPath === refPath),
            [(e) => (e.type === 'dir' ? 1 : -1), 'name'],
            ['desc', 'asc']
        );
    });

    findPr = computedFn(function (this: CmsStore, prNumber: number) {
        return this.github?.PRs.find((pr) => pr.number === prNumber);
    });

    findBranch = computedFn(function (this: CmsStore, branch: string) {
        return this.github?.branches.find((b) => b.name === branch);
    });

    findPrByBranch = computedFn(function (this: CmsStore, branch: string) {
        return this.github?.PRs.find((pr) => pr.branchName === branch);
    });

    @action
    setIsEditing(file: FileModel | FileStub, isEditing: boolean) {
        this.triggerNavigateToFile(file.branch, isEditing ? file.path : null);
    }

    @action
    setActiveEntry(entry: iEntry, reload = false) {
        if (reload) {
            this.github?.clearEntries(entry.branch);
        }
        this.triggerNavigateToFile(entry.branch, entry.path);
    }

    @computed
    get activeEntry() {
        return this.editedFile || this.rootDir;
    }

    @computed
    get editedFile() {
        return this.findEntry<FileModel | BinFile | FileStub>(this.activeBranchName, this.activeFilePath);
    }

    @action
    initialize() {
        if (this.initialized) {
            return;
        }
        this.loadSettings()
            .then(
                action((res) => {
                    this.initialized = true;
                })
            )
            .catch((err) => {
                console.log('err from loadSettings', err);
            });
    }

    @computed
    get needsGithubLogin() {
        return this.initialized && !this.settings;
    }

    @action
    loadSettings() {
        return this.withAbortController(`load-settings`, (ct) => {
            return apiLoadSettings(ct.signal).then(
                action(({ data }) => {
                    return this.handleSettingsChange(data);
                })
            );
        });
    }

    @action
    uploadImage(file: File, imagePath: string, branch: string, sha?: string, maxSizeMB: number = 1) {
        const { github } = this;
        if (!github) {
            return Promise.resolve(undefined);
        }
        return imageCompression(file, { maxSizeMB: maxSizeMB, maxWidthOrHeight: 3840, useWebWorker: true })
            .then((compressedFile) => {
                return compressedFile.arrayBuffer();
            })
            .then((binData) => {
                return github.createOrUpdateFile(imagePath, new Uint8Array(binData), branch, sha);
            })
            .catch(function (error) {
                console.log(error.message);
                return undefined;
            });
    }

    @action
    private configureRepo(repo: string) {
        if (this.repoKey === repo) {
            return;
        }
        const [owner, name] = repo.split('/');
        this.github?.reset();
        this.activeBranchName = undefined;
        this.activeFilePath = '';
        this.repoOwner = owner;
        this.repoName = name;
        this.github?.load();
    }

    /** the token is refreshed by loading the settings, see the cms api */
    private refreshTokenIfNeeded() {
        if (this.settings?.needsRefresh) {
            this.loadSettings();
        }
    }

    /** the location is forgotten, the default branch is opened (with the same path) */
    @action
    private handleInvalidBranch(repo: string, branch: string) {
        if (repo !== this.repoKey || branch !== this.activeBranchName) {
            return;
        }
        this.visits.forget(repo, branch);
        const defaultBranch = this.github?.defaultBranchName;
        if (branch === defaultBranch) {
            return;
        }
        this.navigateTo({ repo, branch: defaultBranch, path: this.activeFilePath }, true);
    }

    /** the root directory of the branch is opened instead, which replaces the visit */
    @action
    private handleInvalidPath(repo: string, branch: string, path: string) {
        if (repo !== this.repoKey || branch !== this.activeBranchName || path !== this.activeFilePath) {
            return;
        }
        this.navigateTo({ repo, branch, path: '' }, true);
    }
}
