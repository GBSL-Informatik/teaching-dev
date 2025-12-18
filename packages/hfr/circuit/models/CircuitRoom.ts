import DynamicRoom from '@tdev-models/documents/DynamicRoom';
import DynamicDocumentRoot from '@tdev-models/documents/DynamicDocumentRoot';
import { action, computed } from 'mobx';
import FlowNode from './FlowNode';
import DocumentStore from '@tdev-stores/DocumentStore';
import {
    applyNodeChanges,
    applyEdgeChanges,
    OnEdgesChange,
    Edge,
    OnNodesChange,
    OnConnect,
    Connection,
    reconnectEdge,
    OnNodesDelete
} from '@xyflow/react';
import { Source } from '@tdev-models/iDocument';
import FlowEdge from './FlowEdge';
import { FlowNodeData, NodeDataMapping, NodeType } from '..';
import { RoomFactory } from '@tdev-api/document';
const MULTI_INPUTS_ALLOWED = new Set<NodeType | undefined>([NodeType.BatteryNode]);

class CircuitRoom extends DynamicRoom<'circuit'> {
    constructor(dynamicRoot: DynamicDocumentRoot<'circuit'>, documentStore: DocumentStore) {
        super(dynamicRoot, documentStore);
    }

    @computed
    get flowNodes() {
        return this.documents.filter((doc) => doc.type === 'flow_node');
    }

    @computed
    get flowEdges() {
        return this.documents.filter((doc) => doc.type === 'flow_edge');
    }

    @computed
    get nodes() {
        return this.flowNodes.map((fn) => fn.node);
    }

    @computed
    get edges() {
        return this.flowEdges.map((fn) => fn.edgeData);
    }

    @action
    reconnectEdge(id: string, connection: Connection) {
        const edge = this.documentStore.find(id) as FlowEdge;
        if (edge) {
            const reconnected = reconnectEdge(edge.edgeData, connection, [edge.edgeData])[0];
            edge.setData(reconnected, Source.LOCAL, new Date());
        }
    }

    @action
    onNodesChange(changes: Parameters<OnNodesChange>[0]) {
        changes.forEach((change) => {
            if (!('id' in change)) {
                return;
            }
            const node = this.flowNodes.find((doc) => doc.id === change.id);
            if (node) {
                node.setData(
                    applyNodeChanges([change], [node.node])[0] as FlowNodeData<NodeType>,
                    Source.LOCAL,
                    new Date()
                );
            }
        });
    }

    @action
    onEdgeChange(changes: Parameters<OnEdgesChange<Edge>>[0]) {
        changes.forEach((change) => {
            if (!('id' in change)) {
                return;
            }
            const edge = this.flowEdges.find((doc) => doc.id === change.id);
            if (edge) {
                edge.setData(applyEdgeChanges([change], [edge.edgeData])[0], Source.LOCAL, new Date());
            }
        });
    }

    @action
    onConnect(connection: Parameters<OnConnect>[0]) {
        const currentEdge = this.flowEdges.find((e) => {
            return e.targetId === connection.target && e.flowData.targetHandle === connection.targetHandle;
        });
        this.documentStore
            .create({
                documentRootId: this.dynamicRoot.rootDocumentId,
                type: 'flow_edge',
                data: {
                    source: connection.source,
                    target: connection.target,
                    sourceHandle: connection.sourceHandle,
                    targetHandle: connection.targetHandle
                }
            })
            .then((newEdge) => {
                const nType = currentEdge?.target?.flowData?.type as NodeType | undefined;
                if (newEdge && currentEdge && !MULTI_INPUTS_ALLOWED.has(nType)) {
                    this.documentStore.apiDelete(currentEdge);
                }
            });
    }

    @action
    onDelete(deleted: Parameters<OnNodesDelete>[0]) {
        deleted.forEach((node) => {
            const doc = this.documentStore.find(node.id) as FlowNode<NodeType>;
            if (!doc) {
                return;
            }
            doc.edges.forEach((edge) => {
                this.documentStore.apiDelete(edge);
            });
            this.documentStore.apiDelete(doc);
        });
    }

    @action
    addFlowNode<N extends NodeType>(type: N, data: NodeDataMapping[N]) {
        console.log(this.flowNodes.find((n) => n.flowData.selected));
        this.documentStore.create({
            documentRootId: this.dynamicRoot.rootDocumentId,
            type: 'flow_node',
            data: {
                data: data,
                type: type,
                position: {
                    x: 100,
                    y: 100
                }
            }
        });
    }
}

export const createRoom: RoomFactory = (dynamicRoot, documentStore) => {
    return new CircuitRoom(dynamicRoot, documentStore);
};

export default CircuitRoom;
