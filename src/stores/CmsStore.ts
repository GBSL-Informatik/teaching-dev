import { action, computed, observable, reaction } from 'mobx';
import { RootStore } from '@tdev-stores/rootStore';
import iStore from '@tdev-stores/iStore';
import {
    githubToken as apiGithubToken,
    load as apiLoadSettings,
    update as apiUpdateSettings,
    CmsSettings,
    FullCmsSettings
} from '@tdev-api/cms';
import siteConfig from '@generated/docusaurus.config';
import Dir from '@tdev-models/cms/Dir';
import { default as FileModel } from '@tdev-models/cms/File';
import { computedFn } from 'mobx-utils';
import _ from 'lodash';
import Settings from '@tdev-models/cms/Settings';
import Github from '@tdev-models/cms/Github';
import FileStub from '@tdev-models/cms/FileStub';
import iEntry from '@tdev-models/cms/iEntry';
import { trimSlashes } from '@tdev-models/helpers/trimSlashes';
import PartialSettings, { REFRESH_THRESHOLD } from '@tdev-models/cms/PartialSettings';
import imageCompression from 'browser-image-compression';
import BinFile from '@tdev-models/cms/BinFile';
import CmsViewStore from './ViewStores/CmsViewStore';
import iFile from '@tdev-models/cms/iFile';
import type * as Preset from '@docusaurus/preset-classic';

const { organizationName, projectName, presets } = siteConfig;
if (!organizationName || !projectName) {
    throw new Error('"organizationName" and "projectName" must be set in docusaurus.config.ts');
}

export class CmsStore extends iStore<`update-settings` | `load-settings` | `load-token`> {
    readonly root: RootStore;
    @observable.ref accessor settings: Settings | undefined;
    @observable.ref accessor partialSettings: PartialSettings | undefined;
    @observable.ref accessor github: Github | undefined;
    @observable.ref accessor viewStore: CmsViewStore;

    @observable accessor initialized = false;

    constructor(store: RootStore) {
        super();
        this.root = store;
        this.viewStore = new CmsViewStore(this);
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
                [this.activeFilePath, this.activeBranchName, this.github] as [
                    string | undefined,
                    string | undefined,
                    Github | undefined
                ],
            action(([fileName, branch, github]) => {
                if (fileName && branch && github) {
                    const dummy = FileStub.DummyFile(fileName, branch, this, false);
                    this.fetchFile(dummy).catch(() => {
                        this.github?._rmFileEntry(dummy);
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
    get canModifyActiveBranch() {
        if (this.root.userStore.current?.isAdmin) {
            return true;
        }
        return !this.isOnDefaultBranch;
    }

    @computed
    get isOnDefaultBranch() {
        return !!this.activeBranch?.isDefault;
    }

    @computed
    get activeFilePath() {
        return this.settings?.activePath;
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
        this.settings?.setLocation(file.branch, isEditing ? file.path : null);
    }

    @action
    setActiveEntry(entry: iEntry, reload = false) {
        if (reload) {
            this.github?.clearEntries(entry.branch);
        }
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
                    this.partialSettings = new PartialSettings(data as CmsSettings, this);
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

    @action
    uploadImage(file: File, imagePath: string, branch: string, sha?: string, maxSizeMB: number = 1) {
        const { github } = this;
        if (!github) {
            return Promise.resolve(undefined);
        }
        return imageCompression(file, { maxSizeMB: maxSizeMB, maxWidthOrHeight: 3840, useWebWorker: true })
            .then((compressedFile) => {
                console.log(compressedFile);
                return compressedFile.arrayBuffer();
                // return imageCompression.getDataUrlFromFile(compressedFile);
            })
            .then((binData) => {
                // dataUrl looks like: data:image/jpeg;base64,/9j/4AAQSkZJRg...
                // take only the content after the comma
                // const base64 = binData.split(',')[1];
                return github.createOrUpdateFile(imagePath, new Uint8Array(binData), branch, sha);
            })
            .catch(function (error) {
                console.log(error.message);
                return undefined;
            });
    }
}
