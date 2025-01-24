import { CmsSettings, FullCmsSettings } from '@tdev-api/cms';
import { CmsStore } from '@tdev-stores/CmsStore';
import _ from 'lodash';
import { action, computed, observable } from 'mobx';
import File from './File';
import iEntry from './iEntry';
import Dir from './Dir';

export const REFRESH_THRESHOLD = 60 * 60;

class Settings {
    readonly store: CmsStore;
    readonly id: string;
    readonly userId: string;
    readonly token: string;
    readonly tokenExpiresAt: Date;
    readonly createdAt: Date;

    @observable.ref accessor _pristine: CmsSettings;
    @observable.ref accessor updatedAt: Date;

    @observable accessor activeBranchName: string | undefined | null;
    @observable accessor activePath: string | undefined | null;

    constructor(props: FullCmsSettings, store: CmsStore) {
        this.store = store;
        this._pristine = props;
        this.id = props.id;
        this.userId = props.userId;
        this.activeBranchName = props.activeBranch;
        this.activePath = props.activePath;
        this.token = props.token;
        this.tokenExpiresAt = new Date(props.tokenExpiresAt);
        this.createdAt = new Date(props.createdAt);
        this.updatedAt = new Date(props.updatedAt);
    }

    @computed
    get activeEntry(): File | undefined {
        if (!this.activePath || !this.activeBranchName) {
            return;
        }
        return this.store.findEntry(this.activeBranchName, this.activePath);
    }

    @action
    refreshToken() {
        this.store.loadSettings();
    }

    @action
    setActiveBranchName(branch: string, save: boolean = true) {
        this.activeBranchName = branch;
        if (save) {
            this.save();
        }
    }

    @action
    setActivePath(path: string, save: boolean = true) {
        if (this.activePath === path) {
            return;
        }
        this.activePath = path;
        if (save) {
            this.save();
        }
    }

    @action
    setActiveEntry(entry: iEntry) {
        this.setActiveBranchName(entry.branch, false);
        this.setActivePath(entry.path, false);
        if (entry._isFileType) {
            this.save();
        } else {
            (entry as Dir).setOpen(true);
        }
    }

    @action
    setLocation(branch: string, path: string | null) {
        this.setActiveBranchName(branch, false);
        this.setActivePath(path || '', false);
        this.save();
    }

    @action
    clearLocation() {
        this.activeBranchName = null;
        this.activePath = null;
        this.save();
    }

    @action
    save() {
        return this.store.saveSettings();
    }

    @computed
    get props(): CmsSettings {
        return {
            id: this.id,
            userId: this.userId,
            activeBranch: this.activeBranchName,
            activePath: this.activePath,
            token: this.token,
            tokenExpiresAt: this.tokenExpiresAt?.toISOString(),
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }

    @computed
    get expiresInSeconds() {
        if (!this.tokenExpiresAt) {
            return 0;
        }
        return Math.floor((this.tokenExpiresAt.getTime() - Date.now()) / 1000);
    }

    @computed
    get isExpired() {
        return this.expiresInSeconds <= 0;
    }

    @computed
    get dirtyProps(): Partial<CmsSettings> {
        const dirty: Partial<CmsSettings> = {};
        if (this.activeBranchName !== this._pristine.activeBranch) {
            dirty.activeBranch = this.activeBranchName;
        }
        if (this.activePath !== this._pristine.activePath) {
            dirty.activePath = this.activePath;
        }
        return dirty;
    }

    @computed
    get isDirty() {
        return Object.keys(this.dirtyProps).length > 0;
    }
}

export default Settings;
