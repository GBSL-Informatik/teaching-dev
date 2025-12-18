import iDeriver from './iDeriver';
import type FlowNode from '../FlowNode';
import { NodeType } from '@tdev-api/document';
import { action, computed } from 'mobx';
import { Source } from '@tdev-models/iDocument';

class Led extends iDeriver<NodeType.LedNode> {
    constructor(node: FlowNode<NodeType.LedNode>) {
        super(node);
    }

    @computed
    get power() {
        return this.flowNode.inputEdgeA?.isPowerOn ? 1 : 0;
    }
}

export default Led;
