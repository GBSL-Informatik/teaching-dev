import { NodeType } from '@hfr/circuit';
import type FlowNode from '../FlowNode';

class iDeriver<NType extends NodeType> {
    readonly flowNode: FlowNode<NType>;
    constructor(node: FlowNode<NType>) {
        this.flowNode = node;
    }

    get power() {
        return (this.flowNode.flowData.data as { power?: number }).power ?? 0;
    }
}

export default iDeriver;
