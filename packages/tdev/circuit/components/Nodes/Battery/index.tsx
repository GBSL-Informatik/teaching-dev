import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import shared from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { Handle, Node, NodeProps, NodeToolbar, Position, useReactFlow } from '@xyflow/react';
import { mdiBatteryHigh, mdiCarBattery } from '@mdi/js';
import FlowNode from '@tdev/circuit/models/FlowNode';
import { NodeType } from '@tdev-api/document';
import Icon from '@mdi/react';

export type BatteryNode = Node<{}, 'BatteryNode'>;

const BatteryNode = observer((props: NodeProps<BatteryNode>) => {
    const documentStore = useStore('documentStore');
    const doc = documentStore.find(props.id) as FlowNode<NodeType.BatteryNode> | undefined;
    return (
        <div className={clsx(styles.buttonNode)}>
            <Icon path={mdiCarBattery} color="var(--ifm-color-primary)" size={1} />
            <Handle
                type="source"
                position={Position.Top}
                className={clsx(shared.on, shared.handle)}
                style={{ top: -2, left: '73%' }}
            />
            <Handle
                type="target"
                position={Position.Bottom}
                className={clsx(shared.handle)}
                style={{ bottom: 7, left: '27%' }}
            />
        </div>
    );
});

export default BatteryNode;
