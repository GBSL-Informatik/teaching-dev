import iDeriver from '.';
import type FlowNode from '../FlowNode';
import { NodeType } from '@tdev-api/document';
import { computed } from 'mobx';

class Or extends iDeriver<NodeType.OrNode> {
    constructor(node: FlowNode<NodeType.OrNode>) {
        super(node);
    }

    @computed
    get output(): boolean {
        return this.flowNode.targetEdges.some((e) => (e.source?.power || 0) > 0);
    }

    get power(): number {
        return this.output ? 1 : 0;
    }
}

export default Or;
