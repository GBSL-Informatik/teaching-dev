import { FullCmsSettings } from '@tdev-api/cms';
import { action, computed } from 'mobx';
import { CmsStore } from '../stores/CmsStore';
import BinFile from './BinFile';
import Dir from './Dir';
import File from './File';
import FileStub from './FileStub';
import iEntry from './iEntry';
import PartialSettings from './PartialSettings';

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
