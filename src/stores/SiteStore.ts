import { action } from 'mobx';
import { RootStore } from './rootStore';

export default class SiteStore {
    constructor(root: RootStore) {}

    @action
    handleMessage(from: string, message: any) {
        // handle site-wide messages here
    }
}
