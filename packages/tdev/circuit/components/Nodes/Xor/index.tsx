import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import shared from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import FlowNode from '@tdev/circuit/models/FlowNode';
import { NodeType } from '@tdev-api/document';

export type XorNode = Node<{}, 'XXorNode'>;

const XorNode = observer((props: NodeProps<XorNode>) => {
    const documentStore = useStore('documentStore');
    const doc = documentStore.find(props.id) as FlowNode<NodeType.XorNode> | undefined;
    if (!doc) {
        return null;
    }
    return (
        <div className={clsx(styles.xor)}>
            XOR
            <div className={clsx(styles.inputs)}></div>
            <div className={clsx(styles.leftWall)}></div>
            <Handle
                type="target"
                className={clsx(doc.inputEdgeA?.isPowerOn && shared.on, shared.handle)}
                position={Position.Left}
                style={{ top: '2.25px', left: '-12px' }}
                id="a"
            />
            <Handle
                type="target"
                className={clsx(doc.inputEdgeB?.isPowerOn && shared.on, shared.handle)}
                position={Position.Left}
                style={{ top: '16.5px', left: '-12px' }}
                id="b"
            />
            <div className={clsx(styles.output)}></div>
            <Handle
                type="source"
                className={clsx(doc.deriver.output && shared.on, shared.handle)}
                position={Position.Right}
                style={{ left: '28px' }}
            />
        </div>
    );
});

export default XorNode;
