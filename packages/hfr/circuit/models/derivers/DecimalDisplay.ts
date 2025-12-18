import iDeriver from './iDeriver';
import type FlowNode from '../FlowNode';
import { NodeType } from '@tdev-api/document';
import { Source } from '@tdev-models/iDocument';
import { action, computed } from 'mobx';
import { orderBy } from 'es-toolkit';

class DecimalDisplay extends iDeriver<NodeType.DecimalDisplayNode> {
    constructor(node: FlowNode<NodeType.DecimalDisplayNode>) {
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

    @computed
    get decNumber(): number {
        const pins = orderBy(
            this.flowNode.edgesIn.map((e) => ({
                pin: e.flowData.targetHandle,
                value: e.source?.deriver?.power > 0 ? 1 : 0 || 0
            })),
            ['pin'],
            ['asc']
        ).map((e) => e.value);
        return pins.reduce((acc, val, idx) => acc + val * (1 << idx), 0);
    }

    @action
    removePin() {
        if (this.pins < 2) {
            return;
        }
        const lastPinId = this.pinIds[this.pinIds.length - 1];
        const lastPin = this.flowNode.edgesIn.find((e) => e.flowData.targetHandle === lastPinId);
        if (lastPin) {
            this.flowNode.store.apiDelete(lastPin);
        }
        this.flowNode.setData(
            { ...this.flowNode.flowData, data: { pins: this.pins - 1 } },
            Source.LOCAL,
            new Date()
        );
    }
}

export default DecimalDisplay;
