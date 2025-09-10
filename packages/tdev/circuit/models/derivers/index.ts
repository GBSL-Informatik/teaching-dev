import type { NodeType } from '@tdev-api/document';
import type { Node } from '@xyflow/react';
import { action, computed, observable } from 'mobx';
import type FlowNode from '../FlowNode';

class iDeriver<NType extends NodeType> {
    readonly flowNode: FlowNode<NType>;
    constructor(node: FlowNode<NType>) {
        this.flowNode = node;
    }

    get power() {
        return 0;
    }
}

export default iDeriver;
