import type { RootStore } from '@tdev-stores/rootStore';
import { action, observable } from 'mobx';
import Cookie from '../models/Cookie';

export default class CookieStore {
    readonly root: RootStore;
    readonly cookies = observable.map<string, Cookie>([], { deep: false });

    constructor(root: RootStore) {
        this.root = root;
    }

    get pyodideStore() {
        return this.root.viewStore.useStore('pyodideStore');
    }

    @action
    useCookie(id: string): Cookie {
        let cookie = this.cookies.get(id);
        if (!cookie) {
            cookie = new Cookie(id, this);
            this.cookies.set(id, cookie);
        }
        return cookie;
    }
}
