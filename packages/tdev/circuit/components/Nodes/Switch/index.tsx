import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { Handle, Node, NodeProps, NodeToolbar, Position, useReactFlow } from '@xyflow/react';
import Button from '@tdev-components/shared/Button';
import { mdiButtonPointer, mdiElectricSwitch, mdiElectricSwitchClosed } from '@mdi/js';
import FlowNode from '@tdev/circuit/models/FlowNode';
import { Source } from '@tdev-models/iDocument';
import { NodeType } from '@tdev-api/document';

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
    return (
        <div className={clsx(styles.buttonNode)}>
            <Button
                active={doc?.deriver.power === 1}
                icon={doc?.deriver.power === 1 ? mdiElectricSwitchClosed : mdiElectricSwitch}
                onClick={onClick}
            />
            <Handle type="source" position={Position.Right} />
        </div>
    );
});

export default SwitchNode;
