import iDeriver from './iDeriver';
import type FlowNode from '../FlowNode';
import { NodeType } from '@tdev-api/document';

class Battery extends iDeriver<NodeType.BatteryNode> {
    constructor(node: FlowNode<NodeType.BatteryNode>) {
        super(node);
    }

    get power(): number {
        return 1;
    }
}

export default Battery;
