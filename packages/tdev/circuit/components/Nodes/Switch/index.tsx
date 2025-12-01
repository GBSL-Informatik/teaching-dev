import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import shared from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { Handle, Node, NodeProps, NodeToolbar, Position, useReactFlow } from '@xyflow/react';
import Button from '@tdev-components/shared/Button';
import {
    mdiButtonPointer,
    mdiElectricSwitch,
    mdiElectricSwitchClosed,
    mdiToggleSwitch,
    mdiToggleSwitchOff,
    mdiToggleSwitchOffOutline
} from '@mdi/js';
import FlowNode from '@tdev/circuit/models/FlowNode';
import { Source } from '@tdev-models/iDocument';
import { NodeType } from '@tdev-api/document';
import NodeWrapper from '../NodeWrapper';

export type SwitchNode = Node<{}, 'SwitchNode'>;

const SwitchNode = observer((props: NodeProps<SwitchNode>) => {
    const documentStore = useStore('documentStore');
    const doc = documentStore.find(props.id) as FlowNode<NodeType.SwitchNode> | undefined;
    const onClick = React.useCallback<React.MouseEventHandler<HTMLButtonElement>>(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            doc?.deriver.toggle();
        },
        [props.id, doc, doc?.deriver.power]
    );
    const isPowered = doc?.inputEdgeA ? doc?.deriver.power : 0;
    if (!doc) {
        return null;
    }
    return (
        <NodeWrapper node={doc} className={styles.buttonNode}>
            <Button
                color={isPowered ? 'green' : undefined}
                icon={doc?.deriver.power ? mdiElectricSwitchClosed : mdiElectricSwitch}
                size={0.6}
                onClick={onClick}
            />
            <Handle
                type="target"
                id="a"
                position={Position.Left}
                className={clsx(doc?.inputEdgeA?.isPowerOn && shared.on, shared.handle)}
            />
            <Handle
                type="source"
                position={Position.Right}
                className={clsx(isPowered && shared.on, shared.handle)}
            />
        </NodeWrapper>
    );
});

export default SwitchNode;
