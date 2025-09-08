import DynamicRoom from '@tdev-models/documents/DynamicRooms';
import DynamicDocumentRoot from '@tdev-models/documents/DynamicDocumentRoot';
import { DocumentType, RoomType } from '@tdev-api/document';
import { action, computed, observable } from 'mobx';
import FlowNode from './FlowNode';
import DocumentStore from '@tdev-stores/DocumentStore';
import { Node, NodeChange, OnNodesChange } from '@xyflow/react';
import { Source } from '@tdev-models/iDocument';

class CircuitRoom extends DynamicRoom<RoomType.Circuit> {
    constructor(dynamicRoot: DynamicDocumentRoot<RoomType.Circuit>, documentStore: DocumentStore) {
        super(dynamicRoot, documentStore);
    }

    @computed
    get flowNodes() {
        return this.documents.filter((doc) => doc.type === DocumentType.FlowNode);
    }

    @computed
    get nodes() {
        return this.flowNodes.map((fn) => fn.nodeData);
    }

    @action
    onNodesChange(changes: NodeChange<Node>[]) {
        changes.forEach((change) => {
            if (!('id' in change)) {
                return;
            }

            const node = this.flowNodes.find((doc) => doc.id === change.id);
            if (node) {
                switch (change.type) {
                    case 'dimensions':
                        break;
                    case 'position':
                        node.setData({ position: change.position }, Source.LOCAL, new Date());
                        break;
                    case 'select':
                        node.setData({ selected: change.selected }, Source.LOCAL, new Date());
                        break;
                }
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
