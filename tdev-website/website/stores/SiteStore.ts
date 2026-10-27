import { RootStore } from '@tdev-stores/rootStore';
import { observableRef } from 'mobx';
import ClockStore from './ClockStore';

export default class SiteStore {
    @observableRef accessor clockStore = new ClockStore();
    constructor(root: RootStore) {}
}
