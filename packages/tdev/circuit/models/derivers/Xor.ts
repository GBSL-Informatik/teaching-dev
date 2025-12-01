import iDeriver from './iDeriver';
import type FlowNode from '../FlowNode';
import { NodeType } from '@tdev-api/document';
import { computed } from 'mobx';

class Xor extends iDeriver<NodeType.XorNode> {
    constructor(node: FlowNode<NodeType.XorNode>) {
        super(node);
    }

    @computed
    get output(): boolean {
        return (
            !this.flowNode.edgesIn.every((e) => e.source?.deriver?.power > 0) &&
            this.flowNode.edgesIn.some((e) => e.source?.deriver?.power > 0)
        );
    }

    get power(): number {
        return this.output ? 1 : 0;
    }
}

export default Xor;
