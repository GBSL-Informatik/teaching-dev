import FlowNode from '@tdev/circuit/models/FlowNode';
import FlowEdge from '@tdev/circuit/models/FlowEdge';
import { Edge, Node } from '@xyflow/react';

export enum NodeType {
    LedNode = 'LedNode',
    NotNode = 'NotNode',
    DecimalDisplayNode = 'DecimalDisplayNode',
    BatteryNode = 'BatteryNode',
    SwitchNode = 'SwitchNode',
    OrNode = 'OrNode',
    XorNode = 'XorNode',
    AndNode = 'AndNode'
}

export interface NodeDataMapping {
    [NodeType.LedNode]: {};
    [NodeType.BatteryNode]: { pins: number };
    [NodeType.DecimalDisplayNode]: { pins: number };
    [NodeType.OrNode]: {};
    [NodeType.NotNode]: {};
    [NodeType.XorNode]: {};
    [NodeType.AndNode]: {};
    [NodeType.SwitchNode]: {
        power: 0 | 1;
    };
}

export type FlowNodeDataFull<T extends NodeType> = Node<NodeDataMapping[T], T>;
export type FlowNodeData<T extends NodeType> = Omit<FlowNodeDataFull<T>, 'id'>;
export type FlowEdgeData = Omit<Edge, 'id'>;
declare module '@tdev-api/document' {
    export interface RoomTypeNames {
        ['circuit']: 'circuit';
    }
    export interface TypeDataMapping {
        ['flow_node']: FlowNodeData<NodeType>;
        ['flow_edge']: FlowEdgeData;
    }
    export interface TypeModelMapping {
        ['flow_node']: FlowNode<NodeType>;
        ['flow_edge']: FlowEdge;
    }
}
