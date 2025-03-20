import { CmsSettings } from '@tdev-api/cms';
import { CmsStore } from '@tdev-stores/CmsStore';
import _ from 'lodash';
import { action, computed, observable } from 'mobx';

export const REFRESH_THRESHOLD = 60 * 60;

class PartialSettings {
    readonly store: CmsStore;
    readonly id: string;
    readonly userId: string;
    readonly _token?: string;
    readonly _tokenExpiresAt?: Date;
    readonly createdAt: Date;

    @observable.ref accessor _pristine: CmsSettings;
    @observable.ref accessor updatedAt: Date;

    @observable accessor activeBranchName: string | undefined | null;
    @observable accessor activePath: string | undefined | null;

    constructor(props: CmsSettings, store: CmsStore) {
        this.store = store;
        this._pristine = props;
        this.id = props.id;
        this.userId = props.userId;
        this.activeBranchName = props.activeBranch;
        this.activePath = props.activePath;
        this._token = props.token;
        this._tokenExpiresAt = props.tokenExpiresAt ? new Date(props.tokenExpiresAt) : undefined;
        this.createdAt = new Date(props.createdAt);
        this.updatedAt = new Date(props.updatedAt);
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
        const newPath = (path || '').replaceAll(/(^\/|\/$)/g, ''); // remove leading and trailing slashes
        if (this.activePath === newPath) {
            return;
        }
        this.activePath = newPath;
        if (save) {
            this.save();
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

    get token() {
        return this._token;
    }

    get tokenExpiresAt() {
        return this._tokenExpiresAt;
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

    get needsRefresh() {
        return this.expiresInSeconds < REFRESH_THRESHOLD;
    }
}

export default PartialSettings;
