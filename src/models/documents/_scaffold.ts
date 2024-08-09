import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '../iDocument';
import {
    DocumentType,
    Document as DocumentProps,
    TaskStateData,
    StateType,
    TypeDataMapping,
    Access
} from '@site/src/api/document';
import DocumentStore from '@site/src/stores/DocumentStore';
import { TypeMeta } from '../DocumentRoot';

export interface MetaInit {
    readonly?: boolean;
}

// TODO: replace all DocumentType.TaskState values to your new models Type
export class ModelMeta extends TypeMeta<DocumentType.TaskState> {
    readonly type = DocumentType.TaskState;

    constructor(props: Partial<MetaInit>) {
        super(DocumentType.TaskState, props.readonly ? Access.RO : undefined);
    }

    get defaultData(): TypeDataMapping[DocumentType.TaskState] {
        throw 'Not Implemented';
    }
}

class Model extends iDocument<DocumentType.TaskState> {
    constructor(props: DocumentProps<DocumentType.TaskState>, store: DocumentStore) {
        super(props, store);
    }

    @action
    setData(data: TypeDataMapping[DocumentType.TaskState], from: Source, updatedAt?: Date): void {
        // TODO: change state according to data
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping[DocumentType.TaskState] {
        // TODO: return correct data
        return {} as any;
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === DocumentType.TaskState) {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }
}

export default Model;
