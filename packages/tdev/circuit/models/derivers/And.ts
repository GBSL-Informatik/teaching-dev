import iDeriver from './iDeriver';
import type FlowNode from '../FlowNode';
import { NodeType } from '@tdev-api/document';
import { computed } from 'mobx';

class And extends iDeriver<NodeType.AndNode> {
    constructor(node: FlowNode<NodeType.AndNode>) {
        super(node);
    }

    @computed
    get output(): boolean {
        return (
            this.flowNode.targetEdges.length >= 2 &&
            this.flowNode.targetEdges.every((e) => e.source?.deriver?.power > 0)
        );
    }

    get power(): number {
        return this.output ? 1 : 0;
    }
}

export default And;
