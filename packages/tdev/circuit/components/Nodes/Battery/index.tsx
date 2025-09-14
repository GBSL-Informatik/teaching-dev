import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import shared from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import {
    Handle,
    Node,
    NodeProps,
    NodeToolbar,
    Position,
    useReactFlow,
    useUpdateNodeInternals
} from '@xyflow/react';
import { mdiBatteryHigh, mdiCarBattery, mdiMinusCircle, mdiPlusCircle } from '@mdi/js';
import FlowNode from '@tdev/circuit/models/FlowNode';
import { NodeType } from '@tdev-api/document';
import { SIZE_S, SIZE_XS } from '@tdev-components/shared/iconSizes';
import Icon from '@mdi/react';
import Button from '@tdev-components/shared/Button';

export type BatteryNode = Node<{}, 'BatteryNode'>;

const BatteryNode = observer((props: NodeProps<BatteryNode>) => {
    const documentStore = useStore('documentStore');
    const updateNodeInternals = useUpdateNodeInternals();
    const doc = documentStore.find(props.id) as FlowNode<NodeType.BatteryNode> | undefined;
    const pins = doc?.deriver.pins ?? 3;
    return (
        <div className={clsx(styles.battery)}>
            <Icon path={mdiCarBattery} color="var(--ifm-color-primary)" size={1} />
            <Handle
                type="source"
                position={Position.Top}
                className={clsx(shared.on, shared.handle)}
                style={{ top: -2, left: '17px' }}
            />
            {Array.from({ length: pins }).map((_, i) => (
                <Handle
                    key={i}
                    id={i === 0 ? 'a' : i === 1 ? 'b' : `p${i}`}
                    type="target"
                    position={i === 0 ? Position.Bottom : Position.Top}
                    className={clsx(shared.handle)}
                    style={{ top: `${25 - (i === 0 ? 5 : 0)}px`, left: `${5 + i * 50}px` }}
                />
            ))}
            <div className={clsx(styles.ground)} style={{ ['--data-width' as any]: `${(pins - 1) * 50}px` }}>
                <Button
                    icon={mdiPlusCircle}
                    size={0.3}
                    className={clsx(styles.pin, styles.pinAdd)}
                    onClick={() => {
                        doc?.deriver.addPin();
                        updateNodeInternals(props.id);
                    }}
                />
                <Button
                    icon={mdiMinusCircle}
                    size={0.3}
                    className={clsx(styles.pin, styles.pinRemove)}
                    onClick={() => {
                        doc?.deriver.removePin();
                        updateNodeInternals(props.id);
                    }}
                />
            </div>
        </div>
    );
});

export default BatteryNode;
