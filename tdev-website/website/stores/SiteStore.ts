import { RootStore } from '@tdev-stores/rootStore';
import { Message } from '@tdev/pyodide-code/pyodideJsModules';
import { action, observable } from 'mobx';
import ClockStore from './ClockStore';

export default class SiteStore {
    @observable.ref accessor clockStore = new ClockStore();
    constructor(root: RootStore) {}

    @action
    handleMessage(from: string, message: any) {
        switch (from) {
            case 'pyodide':
                const pyodideMessage = message as Message;
                switch (pyodideMessage.type) {
                    case 'clock':
                        const clock = this.clockStore.useClock(message.id);
                        switch (message.clockType) {
                            case 'hours':
                                clock.setHours(message.value);
                                break;
                            case 'minutes':
                                clock.setMinutes(message.value);
                                break;
                            case 'seconds':
                                clock.setSeconds(message.value);
                                break;
                        }
                        break;
                }

                break;
            default:
                // handle other messages here
                break;
        }
    }
}
