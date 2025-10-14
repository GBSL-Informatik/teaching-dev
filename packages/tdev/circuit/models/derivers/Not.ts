import iDeriver from './iDeriver';
import type FlowNode from '../FlowNode';
import { NodeType } from '@tdev-api/document';
import { action, computed } from 'mobx';
import { Source } from '@tdev-models/iDocument';

class Not extends iDeriver<NodeType.NotNode> {
    constructor(node: FlowNode<NodeType.NotNode>) {
        super(node);
    }

    @computed
    get power(): number {
        return (this.flowNode.inputEdgeA?.source?.deriver?.power ?? 0) > 0 ? 0 : 1;
    }
}

export default Not;
