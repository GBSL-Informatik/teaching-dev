import { CmsSettings } from '@tdev-api/cms';
import { computed } from 'mobx';
import { CmsStore } from '../stores/CmsStore';

export const REFRESH_THRESHOLD = 60 * 60;

/**
 * The github token of the user. The location stored by the api (`activeBranch`, `activePath`)
 * is not used: it is not scoped by repository, the visits are kept in the browser instead,
 * see `VisitStore`.
 */
class PartialSettings {
    readonly store: CmsStore;
    readonly id: string;
    readonly userId: string;
    readonly _token?: string;
    readonly _tokenExpiresAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(props: CmsSettings, store: CmsStore) {
        this.store = store;
        this.id = props.id;
        this.userId = props.userId;
        this._token = props.token;
        this._tokenExpiresAt = props.tokenExpiresAt ? new Date(props.tokenExpiresAt) : undefined;
        this.createdAt = new Date(props.createdAt);
        this.updatedAt = new Date(props.updatedAt);
    }

    get token() {
        return this._token;
    }

    get tokenExpiresAt() {
        return this._tokenExpiresAt;
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

    get needsRefresh() {
        return this.expiresInSeconds < REFRESH_THRESHOLD;
    }
}

export default PartialSettings;
