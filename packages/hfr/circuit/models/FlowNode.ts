import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import {
    Document as DocumentProps,
    TypeDataMapping,
    Access,
    DocumentTypes,
    Factory
} from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import FlowEdge from './FlowEdge';
import iDeriver from './derivers/iDeriver';
import Or from './derivers/Or';
import And from './derivers/And';
import Switch from './derivers/Switch';
import Battery from './derivers/Battery';
import Led from './derivers/Led';
import Xor from './derivers/Xor';
import Not from './derivers/Not';
import DecimalDisplay from './derivers/DecimalDisplay';
import { FlowNodeData, FlowNodeDataFull, NodeDataMapping, NodeType } from '@hfr/circuit';

export interface MetaInit {
    readonly?: boolean;
}

export class ModelMeta extends TypeMeta<'flow_node'> {
    readonly type = 'flow_node';

    constructor(props: Partial<MetaInit>) {
        super('flow_node', props.readonly ? Access.RO_User : undefined);
    }

    get defaultData(): TypeDataMapping['flow_node'] {
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
    [NodeType.NotNode]: Not;
    [NodeType.XorNode]: Xor;
    [NodeType.AndNode]: And;
    [NodeType.DecimalDisplayNode]: DecimalDisplay;
}

function createDeriver<NType extends NodeType>(node: FlowNode<NType>): DeriverMapping[NType] {
    switch (node.flowData.type) {
        case NodeType.OrNode:
            return new Or(node as FlowNode<NodeType.OrNode>) as DeriverMapping[NType];
        case NodeType.XorNode:
            return new Xor(node as FlowNode<NodeType.XorNode>) as DeriverMapping[NType];
        case NodeType.AndNode:
            return new And(node as FlowNode<NodeType.AndNode>) as DeriverMapping[NType];
        case NodeType.BatteryNode:
            return new Battery(node as unknown as FlowNode<NodeType.BatteryNode>) as DeriverMapping[NType];
        case NodeType.LedNode:
            return new Led(node as FlowNode<NodeType.LedNode>) as DeriverMapping[NType];
        case NodeType.SwitchNode:
            return new Switch(node as unknown as FlowNode<NodeType.SwitchNode>) as DeriverMapping[NType];
        case NodeType.NotNode:
            return new Not(node as FlowNode<NodeType.NotNode>) as DeriverMapping[NType];
        case NodeType.DecimalDisplayNode:
            return new DecimalDisplay(
                node as unknown as FlowNode<NodeType.DecimalDisplayNode>
            ) as DeriverMapping[NType];
        default:
            return new iDeriver(node) as unknown as DeriverMapping[NType];
    }
}

export const createModel: Factory = (data, store) => {
    return new FlowNode(data as DocumentProps<'flow_node'>, store);
};

class FlowNode<NType extends NodeType = NodeType> extends iDocument<'flow_node'> {
    @observable.ref accessor flowData: FlowNodeData<NType>;
    @observable.ref accessor deriver: DeriverMapping[NType];

    constructor(props: DocumentProps<'flow_node'>, store: DocumentStore) {
        super(props, store);
        this.flowData = props.data as FlowNodeData<NType>;
        this.deriver = createDeriver(this);
    }

    @action
    setData(data: TypeDataMapping['flow_node'], from: Source, updatedAt?: Date): void {
        if (!data) {
            this.store.apiDelete(this as DocumentTypes);
            return;
        }
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

    @action
    setSelected(selected: boolean) {
        this.setData(
            {
                ...this.data,
                selected: selected
            },
            Source.LOCAL
        );
    }

    /**
     * tdev data
     */
    @computed
    get data(): TypeDataMapping['flow_node'] {
        return { ...this.flowData } as TypeDataMapping['flow_node'];
    }

    @computed
    get isSelected() {
        return this.node.selected;
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
        if (this.root?.type === 'flow_node') {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }

    @computed
    get edges(): FlowEdge[] {
        return this.store
            .findByDocumentRoot(this.documentRootId)
            .filter<FlowEdge>((doc) => doc.type === 'flow_edge')
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
