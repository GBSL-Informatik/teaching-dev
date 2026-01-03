import { action, computed, observable } from 'mobx';
import { Document as DocumentProps, DocumentType, Access } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import _ from 'es-toolkit/compat';
import { NoneAccess, RWAccess, sharedAccess } from './helpers/accessPolicy';
import iDocument from './iDocument';

abstract class iShareableDocument<Type extends DocumentType> extends iDocument<Type> {
    @observable accessor name: string;
    constructor(
        props: DocumentProps<Type> & { data: DocumentProps<Type>['data'] & { name: string } },
        store: DocumentStore,
        saveDebounceTime?: number
    ) {
        super(props, store, saveDebounceTime);
        this.name = props.data.name;
    }

    @action
    setName(name: string) {
        this.name = name;
    }

    @computed
    get access() {
        const userId = this.store.root.userStore.current?.id;
        if (!userId || !this.root) {
            return Access.None_DocumentRoot;
        }
        if (this.store.root.userStore.isUserSwitched) {
            return Access.RO_DocumentRoot;
        }
        return sharedAccess(this.root.permission, this.root.sharedAccess, this.authorId === userId);
    }

    @computed
    get hasAdminAccess() {
        return this.store.root.userStore.current?.hasElevatedAccess || false;
    }

    @computed
    get canWrite() {
        return RWAccess.has(this.access);
    }

    @computed
    get canRead() {
        return !NoneAccess.has(this.access);
    }
}

export default iShareableDocument;
