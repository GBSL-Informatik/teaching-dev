import iDeriver from './iDeriver';
import type FlowNode from '../FlowNode';
import { NodeType } from '@tdev-api/document';
import { action } from 'mobx';
import { Source } from '@tdev-models/iDocument';

class Switch extends iDeriver<NodeType.SwitchNode> {
    constructor(node: FlowNode<NodeType.SwitchNode>) {
        super(node);
    }

    @action
    toggle() {
        this.flowNode.setData({ ...this.flowNode.flowData, data: { power: 1 - this.power } }, Source.LOCAL);
    }
}

export default Switch;
