import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import shared from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import Button from '@tdev-components/shared/Button';
import { mdiElectricSwitch, mdiElectricSwitchClosed } from '@mdi/js';
import FlowNode from '@hfr/circuit/models/FlowNode';
import NodeWrapper from '../NodeWrapper';
import { NodeType } from '@hfr/circuit';
import Icon from '@mdi/react';
import { IfmColors } from '@tdev-components/shared/Colors';

export type SwitchNode = Node<{}, 'SwitchNode'>;

const SwitchNode = observer((props: NodeProps<SwitchNode>) => {
    const documentStore = useStore('documentStore');
    const doc = documentStore.find(props.id) as FlowNode<NodeType.SwitchNode> | undefined;
    const onClick = React.useEffectEvent<React.MouseEventHandler<HTMLDivElement>>((e) => {
        e.preventDefault();
        e.stopPropagation();
        doc?.deriver.toggle();
    });
    const isPowered = doc?.inputEdgeA ? doc?.deriver.power : 0;
    if (!doc) {
        return null;
    }
    return (
        <NodeWrapper node={doc} className={clsx(styles.switch, shared.gate)}>
            <div onClick={onClick} className={clsx(styles.buttonNode)}>
                <Icon
                    path={doc?.deriver.power ? mdiElectricSwitchClosed : mdiElectricSwitch}
                    size={0.6}
                    color={isPowered ? IfmColors.green : IfmColors.gray}
                />
            </div>
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
