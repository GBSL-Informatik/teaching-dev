import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import shared from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import FlowNode from '@hfr/circuit/models/FlowNode';
import { NodeType } from '@hfr/circuit';
import NodeWrapper from '../NodeWrapper';
import AndGate from '../assets/Gate-AND.svg';

export type AndNode = Node<{}, 'AndNode'>;

const AndNode = observer((props: NodeProps<AndNode>) => {
    const documentStore = useStore('documentStore');
    const doc = documentStore.find(props.id) as FlowNode<NodeType.AndNode> | undefined;
    if (!doc) {
        return null;
    }
    return (
        <NodeWrapper node={doc} className={clsx(styles.and, shared.gate, doc.hasCycle && shared.cycle)}>
            <AndGate className={shared.image} />
            AND
            <Handle
                type="target"
                position={Position.Left}
                style={{ top: '10px' }}
                className={clsx(doc.inputEdgeA?.isPowerOn && shared.on, shared.handle)}
                id="a"
            />
            <Handle
                type="target"
                position={Position.Left}
                style={{ top: '30px' }}
                className={clsx(doc.inputEdgeB?.isPowerOn && shared.on, shared.handle)}
                id="b"
            />
            <Handle
                type="source"
                position={Position.Right}
                style={{
                    right: '0px'
                }}
                className={clsx(doc.deriver.output && shared.on, shared.handle)}
            />
        </NodeWrapper>
    );
});

export default AndNode;
