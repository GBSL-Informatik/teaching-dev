import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import {
    DocumentType,
    Document as DocumentProps,
    TypeDataMapping,
    Access,
    FlowNodeData,
    NodeType,
    FlowNodeDataFull,
    NodeDataMapping
} from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { Node } from '@xyflow/react';
import { merge, toMerged } from 'es-toolkit';
import FlowEdge from './FlowEdge';
import iDeriver from './derivers';
import Or from './derivers/Or';
import And from './derivers/And';

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
            type: NodeType.OrNode,
            data: {},
            position: {
                x: 0,
                y: 0
            }
        };
    }
}

interface DeriverMapping {
    [NodeType.SwitchNode]: iDeriver<NodeType.SwitchNode>;
    [NodeType.OrNode]: Or;
    [NodeType.AndNode]: And;
}

function createDeriver<NType extends NodeType>(node: FlowNode<NType>): DeriverMapping[NType] {
    switch (node.flowData.type) {
        case NodeType.OrNode:
            return new Or(node as FlowNode<NodeType.OrNode>) as DeriverMapping[NType];
        case NodeType.AndNode:
            return new And(node as FlowNode<NodeType.AndNode>) as DeriverMapping[NType];
        default:
            return new iDeriver(node) as unknown as DeriverMapping[NType];
    }
}

class FlowNode<NType extends NodeType> extends iDocument<DocumentType.FlowNode> {
    @observable.ref accessor flowData: FlowNodeData<NType>;
    @observable.ref accessor deriver: DeriverMapping[NType];

    constructor(props: DocumentProps<DocumentType.FlowNode>, store: DocumentStore) {
        super(props, store);
        this.flowData = props.data as FlowNodeData<NType>;
        this.deriver = createDeriver(this);
    }

    @action
    setData(data: TypeDataMapping[DocumentType.FlowNode], from: Source, updatedAt?: Date): void {
        this.flowData = data as FlowNodeData<NType>;
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
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
                updatedAt: (this.updatedAt || new Date()).toISOString()
            });
        }
    }

    /**
     * tdev data
     */
    @computed
    get data(): TypeDataMapping[DocumentType.FlowNode] {
        return { ...this.flowData } as TypeDataMapping[DocumentType.FlowNode];
    }

    /**
     * react flow's node
     */
    @computed
    get node(): FlowNodeDataFull<NType> {
        return { ...this.flowData, id: this.id } as FlowNodeDataFull<NType>;
    }

    /**
     * react flow's node data
     */
    get nodeData(): NodeDataMapping[NType] {
        return this.flowData.data;
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === DocumentType.FlowNode) {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }

    @computed
    get edges(): FlowEdge[] {
        return this.store
            .findByDocumentRoot(this.documentRootId)
            .filter<FlowEdge>((doc) => doc.type === DocumentType.FlowEdge)
            .filter((doc) => doc.sourceId === this.id || doc.targetId === this.id);
    }

    @computed
    get sourceEdges(): FlowEdge[] {
        return this.edges.filter((edge) => edge.sourceId === this.id);
    }

    @computed
    get targetEdges(): FlowEdge[] {
        return this.edges.filter((edge) => edge.targetId === this.id);
    }

    @computed
    get power(): number {
        return (this.flowData.data as { power?: number }).power || this.deriver.power || 0;
    }
}

export default FlowNode;
