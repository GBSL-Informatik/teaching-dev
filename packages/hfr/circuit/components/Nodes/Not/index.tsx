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

export type NotNode = Node<{}, 'NotNode'>;

const NotNode = observer((props: NodeProps<NotNode>) => {
    const documentStore = useStore('documentStore');
    const doc = documentStore.find(props.id) as FlowNode<NodeType.NotNode> | undefined;
    if (!doc) {
        return null;
    }
    return (
        <NodeWrapper node={doc} className={styles.not}>
            <svg viewBox="0 0 140 100" className={clsx(styles.background)} xmlns="http://www.w3.org/2000/svg">
                <path
                    fill="var(--ifm-font-color-base)"
                    d={`M0,0 L0,0 L120,50 L0,100 Z
                        M4,7 L4,93 L110,50 Z
                        M120,50 a10,10,0,0,0,20,0 a10,10,0,0,0,-20,0 Z
                        M123,50 a6,6,0,0,1,14,0 a6,6,0,0,1,-14,0 Z
                        M139,48 l10,0 l0,4 l-10,0 Z`}
                />
            </svg>
            NOT
            <Handle
                type="target"
                className={clsx(doc.inputEdgeA?.isPowerOn && shared.on, shared.handle)}
                position={Position.Left}
                style={{ left: '-5px' }}
                id="a"
            />
            <Handle
                type="source"
                className={clsx(doc.deriver.power > 0 && shared.on, shared.handle)}
                position={Position.Right}
                style={{ right: '2px' }}
            />
        </NodeWrapper>
    );
});

export default NotNode;
