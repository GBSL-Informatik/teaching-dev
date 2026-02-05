import { action, computed, observable } from 'mobx';
import { Document as DocumentProps, Access, ContainerType } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import _ from 'es-toolkit/compat';
import { NoneAccess, RWAccess, sharedAccess } from './helpers/accessPolicy';
import iDocument from './iDocument';
import { ContainerMeta } from './documents/DynamicDocumentRoots/ContainerMeta';
import DynamicDocumentRoots from './documents/DynamicDocumentRoots';

interface DocumentContainerData {
    name: string;
}

abstract class iDocumentContainer<Type extends ContainerType> extends iDocument<Type> {
    @observable accessor name: string;

    constructor(
        props: DocumentProps<Type> & { data: DocumentProps<Type>['data'] & DocumentContainerData },
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

    get description(): string | undefined {
        return (this.root?.meta as ContainerMeta<Type>)?.description;
    }

    @computed
    get dynamicDocumentRoot(): DynamicDocumentRoots<Type> | undefined {
        const dynamicRoots = this.store.byDocumentType(
            'dynamic_document_roots'
        ) as DynamicDocumentRoots<Type>[];
        return dynamicRoots
            .filter((dr) => dr.containerType === this.type)
            .find((dr) => dr.documentRootIds.has(this.documentRootId));
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

    @computed
    get documents() {
        return this.root?.allDocuments.filter((doc) => doc.parentId === this.id) || [];
    }

    @action
    loadDocuments() {
        this.store.root.documentRootStore.loadInNextBatch(
            this.documentRootId,
            undefined /* meta is only needed when you want to create a "default" document */,
            {
                userPermissions: false /* already present for this container */,
                groupPermissions: false /* already present for this container */,
                documentRoot: false /* already present for this container */,
                skipCreate: true,
                documents: true
            }
        );
    }
}

export default iDocumentContainer;
