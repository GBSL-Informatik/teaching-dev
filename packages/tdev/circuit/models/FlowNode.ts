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
import iDeriver from './derivers/iDeriver';
import Or from './derivers/Or';
import And from './derivers/And';
import Switch from './derivers/Switch';
import Battery from './derivers/Battery';
import Led from './derivers/Led';

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
    [NodeType.LedNode]: Led;
    [NodeType.BatteryNode]: Battery;
    [NodeType.SwitchNode]: Switch;
    [NodeType.OrNode]: Or;
    [NodeType.AndNode]: And;
}

function createDeriver<NType extends NodeType>(node: FlowNode<NType>): DeriverMapping[NType] {
    switch (node.flowData.type) {
        case NodeType.OrNode:
            return new Or(node as FlowNode<NodeType.OrNode>) as DeriverMapping[NType];
        case NodeType.AndNode:
            return new And(node as FlowNode<NodeType.AndNode>) as DeriverMapping[NType];
        case NodeType.BatteryNode:
            return new Battery(node as unknown as FlowNode<NodeType.BatteryNode>) as DeriverMapping[NType];
        case NodeType.LedNode:
            return new Led(node as FlowNode<NodeType.LedNode>) as DeriverMapping[NType];
        case NodeType.SwitchNode:
            return new Switch(node as unknown as FlowNode<NodeType.SwitchNode>) as DeriverMapping[NType];
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
    get edgesOut(): FlowEdge[] {
        return this.edges.filter((edge) => edge.sourceId === this.id);
    }

    @computed
    get edgesIn(): FlowEdge[] {
        return this.edges.filter((edge) => edge.targetId === this.id);
    }

    @computed
    get inputEdgeA(): FlowEdge | undefined {
        return this.edgesIn.find((edge) => edge.flowData.targetHandle === 'a');
    }
    @computed
    get inputEdgeB(): FlowEdge | undefined {
        return this.edgesIn.find((edge) => edge.flowData.targetHandle === 'b');
    }
}

export default FlowNode;
