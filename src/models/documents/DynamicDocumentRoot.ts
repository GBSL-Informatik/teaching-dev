import { action, computed } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { DocumentType, Document as DocumentProps, TypeDataMapping, Access } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import DocumentRoot, { TypeMeta } from '@tdev-models/DocumentRoot';
import { DocumentRootStore } from '@tdev-stores/DocumentRootStore';
import DynamicDocumentRoots from './DynamicDocumentRoots';

export interface MetaInit {
    readonly?: boolean;
}

export class ModelMeta extends TypeMeta<DocumentType.DynamicDocumentRoot> {
    readonly type = DocumentType.DynamicDocumentRoot;
    readonly store: DocumentStore;
    readonly rootDocumentId: string;
    readonly parentDocumentId: string;

    constructor(
        props: Partial<MetaInit>,
        rootDocumentId: string,
        parentDocumentId: string,
        documentStore: DocumentStore
    ) {
        super(DocumentType.DynamicDocumentRoot, props.readonly ? Access.RO_User : undefined);
        this.store = documentStore;
        this.rootDocumentId = rootDocumentId;
        this.parentDocumentId = parentDocumentId;
    }

    @computed
    get parentDocument(): DynamicDocumentRoots | undefined {
        return this.store.find(this.parentDocumentId) as DynamicDocumentRoots;
    }

    @computed
    get parentRoot(): DocumentRoot<DocumentType.DynamicDocumentRoots> | undefined {
        return this.parentDocument?.root as DocumentRoot<DocumentType.DynamicDocumentRoots>;
    }

    @computed
    get name(): string {
        if (!this.parentDocument) {
            return 'Dynamische Dokumentenwurzel';
        }
        const title = this.parentDocument.dynamicDocumentRoots.find(
            (doc) => doc.id === this.rootDocumentId
        )?.name;
        return title === undefined ? 'Dynamische Dokumentenwurzel' : title;
    }

    @action
    destroy(): void {
        this.parentDocument?.removeDynamicDocumentRoot(this.rootDocumentId);
    }

    @action
    setName(name: string): void {
        if (!this.parentDocument) {
            return;
        }
        this.parentDocument.setName(this.rootDocumentId, name);
        this.parentDocument.saveNow();
    }

    get defaultData(): TypeDataMapping[DocumentType.DynamicDocumentRoot] {
        return {};
    }
}

class DynamicDocumentRoot extends iDocument<DocumentType.DynamicDocumentRoot> {
    constructor(props: DocumentProps<DocumentType.DynamicDocumentRoot>, store: DocumentStore) {
        super(props, store);
        throw new Error('Model not implemented.');
    }

    @action
    setData(data: TypeDataMapping[DocumentType.DynamicDocumentRoot], from: Source, updatedAt?: Date): void {
        throw new Error('Method not implemented.');
    }

    get data(): TypeDataMapping[DocumentType.DynamicDocumentRoot] {
        return {};
    }

    @computed
    get meta(): ModelMeta {
        throw new Error('Method not implemented.');
    }
}

export default DynamicDocumentRoot;