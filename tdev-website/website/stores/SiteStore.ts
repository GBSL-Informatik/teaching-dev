import { RootStore } from '@tdev-stores/rootStore';
import { observableRef } from 'mobx';
import ClockStore from './ClockStore';
import CookieStore from './CookieStore';

export default class SiteStore {
    @observableRef accessor clockStore = new ClockStore();
    @observableRef accessor cookieStore: CookieStore;
    constructor(root: RootStore) {
        this.cookieStore = new CookieStore(root);
    }
}
