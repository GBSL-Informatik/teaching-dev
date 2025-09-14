import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import shared from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import { mdiLedOff, mdiLedOn } from '@mdi/js';
import FlowNode from '@tdev/circuit/models/FlowNode';
import { NodeType } from '@tdev-api/document';
import Icon from '@mdi/react';

export type LedNode = Node<{}, 'LedNode'>;

const LedNode = observer((props: NodeProps<LedNode>) => {
    const documentStore = useStore('documentStore');
    const doc = documentStore.find(props.id) as FlowNode<NodeType.LedNode> | undefined;
    const isPowered = doc?.inputEdgeA ? doc?.deriver.power : 0;
    return (
        <div className={clsx(styles.buttonNode)}>
            <Icon
                path={isPowered ? mdiLedOn : mdiLedOff}
                size={2}
                color={isPowered ? 'var(--tdev-circuit-power-color)' : 'var(--ifm-color-secondary)'}
            />
            <Handle
                type="target"
                id="a"
                style={{ left: '20px', bottom: '7px' }}
                position={Position.Bottom}
                className={clsx(doc?.inputEdgeA?.isPowerOn && shared.on, shared.handle)}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                className={clsx(isPowered && shared.on, shared.handle)}
                style={{ left: '28px', bottom: '12px' }}
            />
        </div>
    );
});

export default LedNode;
