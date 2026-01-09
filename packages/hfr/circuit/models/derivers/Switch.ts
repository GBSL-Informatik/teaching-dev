import iDeriver from './iDeriver';
import type FlowNode from '../FlowNode';
import { NodeType } from '@hfr/circuit';
import { action, computed } from 'mobx';
import { Source } from '@tdev-models/iDocument';

class Switch extends iDeriver<NodeType.SwitchNode> {
    constructor(node: FlowNode<NodeType.SwitchNode>) {
        super(node);
    }

    @computed
    get power() {
        return (this.flowNode.flowData.data as { power?: number }).power ?? 0;
    }

    @action
    toggle() {
        this.flowNode.setData(
            { ...this.flowNode.flowData, data: { power: 1 - this.power } },
            Source.LOCAL,
            new Date()
        );
    }
}

export default Switch;
