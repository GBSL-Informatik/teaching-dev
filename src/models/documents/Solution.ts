import { action, computed } from 'mobx';
import iDocument, { Source } from '../iDocument';
import { DocumentType, Document as DocumentProps, TypeDataMapping, Access } from '@site/src/api/document';
import DocumentStore from '@site/src/stores/DocumentStore';
import { TypeMeta } from '../DocumentRoot';

export interface MetaInit {
    readonly?: boolean;
}

// TODO: replace all DocumentType.Solution values to your new models Type
export class ModelMeta extends TypeMeta<DocumentType.Solution> {
    readonly type = DocumentType.Solution;

    constructor(props: Partial<MetaInit>) {
        super(DocumentType.Solution, props.readonly ? Access.RO : undefined);
    }

    get defaultData(): TypeDataMapping[DocumentType.Solution] {
        return {};
    }
}

class Solution extends iDocument<DocumentType.Solution> {
    constructor(props: DocumentProps<DocumentType.Solution>, store: DocumentStore) {
        super(props, store);
    }

    @action
    setData(data: TypeDataMapping[DocumentType.Solution], from: Source, updatedAt?: Date): void {
        // TODO: change state according to data
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping[DocumentType.Solution] {
        return {};
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === DocumentType.Solution) {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }
}

export default Solution;
