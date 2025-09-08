import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { DocumentType, Document as DocumentProps, TypeDataMapping, Access } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';

export interface MetaInit {
    readonly?: boolean;
}

export class ModelMeta extends TypeMeta<DocumentType.FlowNode> {
    readonly type = DocumentType.FlowNode;

    constructor(props: Partial<MetaInit>) {
        super(DocumentType.FlowNode, props.readonly ? Access.RO_User : undefined);
    }

    get defaultData(): TypeDataMapping[DocumentType.FlowNode] {
        return {
            inputs: [],
            outputs: []
        };
    }
}

class FlowNode extends iDocument<DocumentType.FlowNode> {
    @observable.ref accessor inputs: string[];
    @observable.ref accessor outputs: string[];
    constructor(props: DocumentProps<DocumentType.FlowNode>, store: DocumentStore) {
        super(props, store);
        this.inputs = props.data.inputs || [];
        this.outputs = props.data.outputs || [];
    }

    @action
    setData(data: TypeDataMapping[DocumentType.FlowNode], from: Source, updatedAt?: Date): void {
        this.inputs = [...data.inputs];
        this.outputs = [...data.outputs];
        if (from === Source.LOCAL) {
            /**
             * Assumption:
             *  - local changes are commited only when the scene version is updated!
             *  - only non-deleted elements are commited
             */
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping[DocumentType.FlowNode] {
        return {
            inputs: this.inputs,
            outputs: this.outputs
        };
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === DocumentType.FlowNode) {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }
}

export default FlowNode;
