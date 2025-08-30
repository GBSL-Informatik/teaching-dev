import { FullCmsSettings } from '@tdev-api/cms';
import { CmsStore } from '@tdev-stores/CmsStore';
import _ from 'es-toolkit/compat';
import { action, computed } from 'mobx';
import File from './File';
import iEntry from './iEntry';
import Dir from './Dir';
import PartialSettings from './PartialSettings';
import BinFile from './BinFile';
import FileStub from './FileStub';

class Settings extends PartialSettings {
    constructor(props: FullCmsSettings, store: CmsStore) {
        super(props, store);
    }

    @computed
    get activeEntry(): File | BinFile | FileStub | undefined {
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
    setActiveEntry(entry: iEntry) {
        this.setLocation(entry.branch, entry.path);
        if (entry.type === 'dir') {
            (entry as Dir).setOpen(true);
        }
    }

    get token(): string {
        return this._token as string;
    }
    get tokenExpiresAt(): Date {
        return this._tokenExpiresAt as Date;
    }
}

export default Settings;
