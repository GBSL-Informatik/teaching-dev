import iDeriver from './iDeriver';
import type FlowNode from '../FlowNode';
import { NodeType } from '@hfr/circuit';
import { computed } from 'mobx';

class Or extends iDeriver<NodeType.OrNode> {
    constructor(node: FlowNode<NodeType.OrNode>) {
        super(node);
    }

    @computed
    get output(): boolean {
        return this.flowNode.edgesIn.some((e) => e.source?.deriver?.power > 0);
    }

    get power(): number {
        return this.output ? 1 : 0;
    }
}

export default Or;
