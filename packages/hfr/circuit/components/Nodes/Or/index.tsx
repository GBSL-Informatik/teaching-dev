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
import OrGate from './assets/Gate-OR.svg';

export type OrNode = Node<{}, 'OrNode'>;

const OrNode = observer((props: NodeProps<OrNode>) => {
    const documentStore = useStore('documentStore');
    const doc = documentStore.find(props.id) as FlowNode<NodeType.OrNode> | undefined;
    if (!doc) {
        return null;
    }
    return (
        <NodeWrapper node={doc} className={clsx(styles.or, shared.gate)}>
            <OrGate className={shared.image} />
            OR
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

export default OrNode;
