import type { ClientContext } from '@tdev/pyodide-code/extensions';
import { action, observable } from 'mobx';
import Cookie from './Cookie';

export default class CookieStore {
    readonly context: ClientContext;
    readonly cookies = observable.map<string, Cookie>([], { deep: false });

    constructor(context: ClientContext) {
        this.context = context;
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
