import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { DocumentType, Document as DocumentProps, TypeDataMapping, Access } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';

export interface MetaInit {
    readonly?: boolean;
}

export class ModelMeta extends TypeMeta<DocumentType.Flow> {
    readonly type = DocumentType.Flow;

    constructor(props: Partial<MetaInit>) {
        super(DocumentType.Flow, props.readonly ? Access.RO_User : undefined);
    }

    get defaultData(): TypeDataMapping[DocumentType.Flow] {
        return {};
    }
}

class Flow extends iDocument<DocumentType.Flow> {
    constructor(props: DocumentProps<DocumentType.Flow>, store: DocumentStore) {
        super(props, store);
    }

    @action
    setData(data: TypeDataMapping[DocumentType.Flow], from: Source, updatedAt?: Date): void {
        if (from === Source.LOCAL) {
            // this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping[DocumentType.Flow] {
        return {};
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === DocumentType.Flow) {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }
}

export default Flow;
