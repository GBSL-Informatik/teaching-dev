import DynamicRoom from '@tdev-models/documents/DynamicRooms';
import DynamicDocumentRoot from '@tdev-models/documents/DynamicDocumentRoot';
import { DocumentType, RoomType } from '@tdev-api/document';
import { action, computed, observable } from 'mobx';
import FlowNode from './FlowNode';
import DocumentStore from '@tdev-stores/DocumentStore';
import {
    Node,
    NodeChange,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    EdgeChange,
    OnEdgesChange,
    Edge,
    OnNodesChange,
    OnConnect
} from '@xyflow/react';
import { Source } from '@tdev-models/iDocument';

class CircuitRoom extends DynamicRoom<RoomType.Circuit> {
    constructor(dynamicRoot: DynamicDocumentRoot<RoomType.Circuit>, documentStore: DocumentStore) {
        super(dynamicRoot, documentStore);
    }

    @computed
    get flowNodes() {
        console.log('rerun flow nodes');
        return this.documents.filter((doc) => doc.type === DocumentType.FlowNode);
    }

    @computed
    get flowEdges() {
        return this.documents.filter((doc) => doc.type === DocumentType.FlowEdge);
    }

    @computed
    get nodes() {
        return this.flowNodes.map((fn) => fn.nodeData);
    }

    @computed
    get edges() {
        return this.flowEdges.map((fn) => fn.edgeData);
    }

    @action
    onNodesChange(changes: Parameters<OnNodesChange>[0]) {
        changes.forEach((change) => {
            if (!('id' in change)) {
                return;
            }
            const node = this.flowNodes.find((doc) => doc.id === change.id);
            if (node) {
                node.setData(applyNodeChanges([change], [node.nodeData])[0], Source.LOCAL, new Date());
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
        this.documentStore.create({
            documentRootId: this.dynamicRoot.rootDocumentId,
            type: DocumentType.FlowEdge,
            data: {
                source: connection.source,
                target: connection.target,
                sourceHandle: connection.sourceHandle,
                targetHandle: connection.targetHandle
            }
        });
    }

    @action
    addFlowNode() {
        this.documentStore.create({
            documentRootId: this.dynamicRoot.rootDocumentId,
            type: DocumentType.FlowNode,
            data: {
                data: {},
                position: {
                    x: 100,
                    y: 100
                }
            }
        });
    }
}

export default CircuitRoom;
