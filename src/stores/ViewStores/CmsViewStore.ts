import { CmsStore } from '@tdev-stores/CmsStore';
import iViewStore from './iViewStore';
import { action, computed, observable } from 'mobx';

export default class CmsViewStore extends iViewStore<CmsStore> {
    @observable accessor showFileTree = false;
    @observable accessor isNavOverviewExpanded = false;
    @observable accessor openInlineMathEditor: string | null = null;

    constructor(parent: CmsStore) {
        super(parent);
    }

    @action
    setShowFileTree(show: boolean) {
        this.showFileTree = show;
    }

    @action
    setIsNavOverviewExpanded(isExpanded: boolean) {
        this.isNavOverviewExpanded = isExpanded;
    }
    @action
    setOpenInlineMathEditor(id: string | null) {
        this.openInlineMathEditor = id;
    }

    cleanup() {
        // noop
    }
}
