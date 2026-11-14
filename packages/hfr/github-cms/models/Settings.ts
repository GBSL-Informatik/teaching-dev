import { FullCmsSettings } from '@tdev-api/cms';
import { action } from 'mobx';
import { CmsStore } from '../stores/CmsStore';
import PartialSettings from './PartialSettings';

class Settings extends PartialSettings {
    constructor(props: FullCmsSettings, store: CmsStore) {
        super(props, store);
    }

    @action
    refreshToken() {
        this.store.loadSettings();
    }

    get token(): string {
        return this._token as string;
    }
    get tokenExpiresAt(): Date {
        return this._tokenExpiresAt as Date;
    }
}

export default Settings;
