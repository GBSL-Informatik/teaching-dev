import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import {
    DocumentType,
    Document as DocumentProps,
    TypeDataMapping,
    Access,
    FlowEdgeData
} from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';

export interface MetaInit {
    readonly?: boolean;
}

export class ModelMeta extends TypeMeta<DocumentType.FlowEdge> {
    readonly type = DocumentType.FlowEdge;

    constructor(props: Partial<MetaInit>) {
        super(DocumentType.FlowEdge, props.readonly ? Access.RO_User : undefined);
    }

    get defaultData(): TypeDataMapping[DocumentType.FlowEdge] {
        return {
            source: '',
            target: ''
        };
    }
}

class FlowEdge extends iDocument<DocumentType.FlowEdge> {
    @observable.ref accessor flowData: FlowEdgeData;
    constructor(props: DocumentProps<DocumentType.FlowEdge>, store: DocumentStore) {
        super(props, store, 15);
        this.flowData = props.data;
    }

    @action
    setData(data: TypeDataMapping[DocumentType.FlowEdge], from: Source, updatedAt?: Date): void {
        delete data.type;
        this.flowData = data as any;
        if (from === Source.LOCAL) {
            /**
             * Assumption:
             *  - local changes are commited only when the scene version is updated!
             *  - only non-deleted elements are commited
             */
            this.save();
            this.store.root.socketStore.streamUpdate(this.documentRootId, {
                id: this.id,
                data: data,
                updatedAt: this.updatedAt.toISOString()
            });
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping[DocumentType.FlowEdge] {
        return { ...this.flowData };
    }

    @computed
    get edgeData() {
        return { ...this.flowData, id: this.id };
    }

    @computed
    get isSelected() {
        return this.flowData.selected;
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === DocumentType.FlowEdge) {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }
}

export default FlowEdge;
