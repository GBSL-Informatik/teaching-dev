import { action, computed, observable, reaction } from 'mobx';
import { RootStore } from '@tdev-stores/rootStore';
import iStore, { ApiState } from '@tdev-stores/iStore';
import {
    githubToken as apiGithubToken,
    load as apiLoadSettings,
    update as apiUpdateSettings,
    FullCmsSettings
} from '@tdev-api/cms';
import siteConfig from '@generated/docusaurus.config';
import Dir from '@tdev-models/cms/Dir';
import File from '@tdev-models/cms/File';
import { computedFn } from 'mobx-utils';
import _ from 'lodash';
import Settings, { REFRESH_THRESHOLD } from '@tdev-models/cms/Settings';
import Github from '@tdev-models/cms/Github';
import FileStub from '@tdev-models/cms/FileStub';
import iEntry from '@tdev-models/cms/iEntry';
import { trimSlashes } from '@tdev-models/helpers/trimSlashes';
const { organizationName, projectName } = siteConfig;
if (!organizationName || !projectName) {
    throw new Error('"organizationName" and "projectName" must be set in docusaurus.config.ts');
}

export class CmsStore extends iStore<`update-settings` | `load-settings` | `load-token`> {
    readonly root: RootStore;
    @observable.ref accessor settings: Settings | undefined;
    @observable.ref accessor github: Github | undefined;

    @observable accessor initialized = false;

    constructor(store: RootStore) {
        super();
        this.root = store;
        reaction(
            () => [this.activeBranchName, this.github] as [string | undefined, Github | undefined],
            action(([branch, github]) => {
                if (branch && github) {
                    const { defaultBranchName } = github;
                    github.fetchDirectory(branch).catch((err) => {
                        console.log(`invalid branch, resetting to default: ${defaultBranchName}`, err);
                        if (defaultBranchName) {
                            this.setBranch(defaultBranchName);
                        } else {
                            this.settings?.clearLocation();
                        }
                    });
                }
            })
        );
        reaction(
            () =>
                [this.activeFileName, this.activeBranchName, this.github] as [
                    string | undefined,
                    string | undefined,
                    Github | undefined
                ],
            action(([fileName, branch, github]) => {
                if (fileName && branch && github) {
                    github.fetchFile(branch, fileName).then((file) => {
                        if (file && file.isFile()) {
                            if (file.dir) {
                                file.dir.fetchDirectory();
                            } else {
                                github.fetchDirectoryTree(file).then(() => {
                                    file.dir?.fetchDirectory();
                                });
                            }
                        }
                    });
                }
            })
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

    @action
    _initializeGithub() {
        if (!this.settings || this.settings.isExpired) {
            return;
        }
        this.github = new Github(this.settings.token, this);
        this.github.load();
    }

    @computed
    get activeBranchName() {
        return this.settings?.activeBranchName || this.github?.defaultBranch?.name;
    }

    @computed
    get activeBranch() {
        if (!this.activeBranchName) {
            return undefined;
        }
        return this.findBranch(this.activeBranchName);
    }

    @computed
    get activeFileName() {
        return this.settings?.activePath;
    }

    @computed
    get branchEntries() {
        if (!this.activeBranchName || !this.github) {
            return [] as (Dir | File)[];
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
        this.settings?.setActiveBranchName(name);
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

    @computed
    get isOnMainBranch() {
        return this.github?.defaultBranch?.name === this.activeBranchName;
    }

    findEntry = computedFn(function <T = Dir | File>(
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
            ['type', 'name'],
            ['asc', 'asc']
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
    setIsEditing(file: File | FileStub, isEditing: boolean) {
        this.settings?.setLocation(file.branch, isEditing ? file.path : null);
    }

    @action
    setActiveEntry(entry: iEntry) {
        this.settings?.setActiveEntry(entry);
    }

    @computed
    get activeEntry() {
        return this.settings?.activeEntry || this.rootDir;
    }

    @computed
    get editedFile() {
        return this.settings?.activeEntry;
    }

    @action
    initialize() {
        if (this.initialized) {
            return;
        }
        this.loadSettings().then(
            action((res) => {
                this.initialized = true;
            })
        );
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
                    if (data.token && data.tokenExpiresAt) {
                        this.settings = new Settings(data as FullCmsSettings, this);
                        return this.settings;
                    }
                    return null;
                })
            );
        });
    }

    @action
    saveSettings() {
        const { settings } = this;
        if (!settings || !settings.isDirty) {
            return Promise.resolve();
        }
        return this.withAbortController(`update-settings`, (ct) => {
            return apiUpdateSettings(settings.dirtyProps, ct.signal)
                .then(
                    action(() => {
                        settings.updatedAt = new Date();
                        settings._pristine = settings.props;
                        if (settings.expiresInSeconds < REFRESH_THRESHOLD) {
                            this.loadSettings();
                        }
                    })
                )
                .catch((err) => {
                    return this.loadSettings();
                });
        });
    }
}
