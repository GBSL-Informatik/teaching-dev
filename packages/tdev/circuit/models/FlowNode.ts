import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import {
    DocumentType,
    Document as DocumentProps,
    TypeDataMapping,
    Access,
    FlowNodeData
} from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { Node } from '@xyflow/react';
import { merge, toMerged } from 'es-toolkit';

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
            data: {},
            position: {
                x: 0,
                y: 0
            }
        };
    }
}

class FlowNode extends iDocument<DocumentType.FlowNode> {
    @observable.ref accessor flowData: FlowNodeData;
    constructor(props: DocumentProps<DocumentType.FlowNode>, store: DocumentStore) {
        super(props, store, 5);
        this.flowData = props.data;
    }

    @action
    setData(data: Partial<TypeDataMapping[DocumentType.FlowNode]>, from: Source, updatedAt?: Date): void {
        this.flowData = toMerged(this.flowData, data);
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
        return { ...this.flowData };
    }

    @computed
    get nodeData() {
        return { ...this.flowData, data: { ...this.flowData.data, label: this.id }, id: this.id };
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
