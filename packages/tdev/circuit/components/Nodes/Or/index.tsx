import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import FlowNode from '@tdev/circuit/models/FlowNode';
import { NodeType } from '@tdev-api/document';

export type OrNode = Node<{}, 'OrNode'>;

const OrNode = observer((props: NodeProps<OrNode>) => {
    const documentStore = useStore('documentStore');
    const doc = documentStore.find(props.id) as FlowNode<NodeType.OrNode> | undefined;
    if (!doc) {
        return null;
    }
    // const state = React.useMemo(() => {
    // }, []);
    return (
        <div className={clsx(styles.buttonNode)}>
            OR {doc.deriver.output ? 1 : 0}
            <Handle type="target" position={Position.Left} style={{ top: 0 }} id="a" />
            <Handle type="target" position={Position.Left} style={{ top: 25 }} id="b" />
            <Handle type="source" position={Position.Right} style={{ left: 20 }} />
        </div>
    );
});

export default OrNode;
