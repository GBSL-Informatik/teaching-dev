import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import FlowNode from '@hfr/circuit/models/FlowNode';
import { observer } from 'mobx-react-lite';

interface Props {
    node: FlowNode<any>;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

const NodeWrapper = observer((props: Props) => {
    return (
        <div
            className={clsx(styles.node, props.node.isSelected && styles.selected, props.className)}
            style={props.style}
        >
            {props.children}
        </div>
    );
});

export default NodeWrapper;
