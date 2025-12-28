import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import shared from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import FlowNode from '@hfr/circuit/models/FlowNode';
import NodeWrapper from '../NodeWrapper';
import { NodeType } from '@hfr/circuit';
import XorGate from './assets/Gate-XOR.svg';

export type XorNode = Node<{}, 'XXorNode'>;

const XorNode = observer((props: NodeProps<XorNode>) => {
    const documentStore = useStore('documentStore');
    const doc = documentStore.find(props.id) as FlowNode<NodeType.XorNode> | undefined;
    if (!doc) {
        return null;
    }
    return (
        <NodeWrapper node={doc} className={clsx(styles.xor, shared.gate)}>
            <XorGate className={shared.image} />
            XOR
            <Handle
                type="target"
                className={clsx(doc.inputEdgeA?.isPowerOn && shared.on, shared.handle)}
                position={Position.Left}
                style={{ top: '10px' }}
                id="a"
            />
            <Handle
                type="target"
                className={clsx(doc.inputEdgeB?.isPowerOn && shared.on, shared.handle)}
                position={Position.Left}
                style={{ top: '50px' }}
                id="b"
            />
            <Handle
                type="source"
                className={clsx(doc.deriver.output && shared.on, shared.handle)}
                position={Position.Right}
                style={{ right: '0px' }}
            />
        </NodeWrapper>
    );
});

export default XorNode;
