import iDeriver from './iDeriver';
import type FlowNode from '../FlowNode';
import { NodeType } from '@tdev-api/document';
import { Source } from '@tdev-models/iDocument';
import { action, computed } from 'mobx';

class Battery extends iDeriver<NodeType.BatteryNode> {
    constructor(node: FlowNode<NodeType.BatteryNode>) {
        super(node);
    }

    get power(): number {
        return 1;
    }

    get pins(): number {
        return (this.flowNode.flowData.data as { pins?: number }).pins ?? 3;
    }

    @action
    addPin() {
        this.flowNode.setData(
            { ...this.flowNode.flowData, data: { pins: this.pins + 1 } },
            Source.LOCAL,
            new Date()
        );
    }

    @computed
    get pinIds(): string[] {
        return Array.from({ length: this.pins }).map((_, i) => (i === 0 ? 'a' : i === 1 ? 'b' : `p${i}`));
    }

    @action
    removePin() {
        if (this.pins < 2) {
            return;
        }
        const lastPinId = this.pinIds[this.pinIds.length - 1];
        const lastPin = this.flowNode.edgesIn.find((e) => e.flowData.targetHandle === lastPinId);
        if (lastPin) {
            lastPin.setData(
                { ...lastPin.flowData, targetHandle: this.pinIds[this.pinIds.length - 2] },
                Source.LOCAL,
                new Date()
            );
        }
        this.flowNode.setData(
            { ...this.flowNode.flowData, data: { pins: this.pins - 1 } },
            Source.LOCAL,
            new Date()
        );
    }
}

export default Battery;
