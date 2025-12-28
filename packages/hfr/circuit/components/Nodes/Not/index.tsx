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
import NotGate from './assets/Gate-NOT.svg';

export type NotNode = Node<{}, 'NotNode'>;

const NotNode = observer((props: NodeProps<NotNode>) => {
    const documentStore = useStore('documentStore');
    const doc = documentStore.find(props.id) as FlowNode<NodeType.NotNode> | undefined;
    if (!doc) {
        return null;
    }
    return (
        <NodeWrapper node={doc} className={clsx(styles.not, shared.gate)}>
            <NotGate className={shared.image} />
            NOT
            <Handle
                type="target"
                className={clsx(doc.inputEdgeA?.isPowerOn && shared.on, shared.handle)}
                position={Position.Left}
                style={{ left: '0px' }}
                id="a"
            />
            <Handle
                type="source"
                className={clsx(doc.deriver.power > 0 && shared.on, shared.handle)}
                position={Position.Right}
                style={{ right: '0px' }}
            />
        </NodeWrapper>
    );
});

export default NotNode;
