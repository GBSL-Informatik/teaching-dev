import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import shared from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { Handle, Node, NodeProps, Position, useUpdateNodeInternals } from '@xyflow/react';
import FlowNode from '@tdev/circuit/models/FlowNode';
import { NodeType } from '@tdev-api/document';
import Button from '@tdev-components/shared/Button';
import { mdiMinusCircle, mdiPlusCircle } from '@mdi/js';
import NodeWrapper from '../NodeWrapper';

export type DecimalDisplayNode = Node<{}, 'DecimalDisplayNode'>;

const PIN_HEIGHT = 20;

const DecimalDisplayNode = observer((props: NodeProps<DecimalDisplayNode>) => {
    const documentStore = useStore('documentStore');
    const updateNodeInternals = useUpdateNodeInternals();
    const doc = documentStore.find(props.id) as FlowNode<NodeType.DecimalDisplayNode> | undefined;
    if (!doc) {
        return null;
    }
    const pins = doc.deriver.pins;
    return (
        <NodeWrapper node={doc} className={styles.decimal} style={{ ['--data-size' as any]: `${pins * PIN_HEIGHT}px` }}>
            <div className={clsx(styles.pins)}>
                {Array.from({ length: pins }).map((_, i) => {
                    const handle = i === 0 ? 'a' : i === 1 ? 'b' : `p${i}`;
                    const edge = doc.edgesIn.find((e) => e.flowData.targetHandle === handle);
                    return (
                        <Handle
                            key={i}
                            id={handle}
                            type="target"
                            position={Position.Left}
                            className={clsx(
                                styles.pin,
                                shared.handle,
                                edge && edge.source?.deriver?.power > 0 && shared.on
                            )}
                            style={{
                                top: `${pins * PIN_HEIGHT - 9 - i * PIN_HEIGHT}px`,
                                ['--data-label' as any]: `"${1 << i}"` //`"2^${i}"`
                            }}
                        />
                    );
                })}
            </div>
            <div className={clsx(styles.valueContainer)}>
                <Button
                    icon={mdiPlusCircle}
                    size={0.3}
                    className={clsx(styles.pinBtn, styles.pinAdd)}
                    onClick={() => {
                        doc?.deriver.addPin();
                        updateNodeInternals(props.id);
                    }}
                />
                <div className={clsx(styles.value)}>{doc.deriver.decNumber ?? '123'}</div>
                <Button
                    icon={mdiMinusCircle}
                    size={0.3}
                    className={clsx(styles.pinBtn, styles.pinRemove)}
                    onClick={() => {
                        doc?.deriver.removePin();
                        updateNodeInternals(props.id);
                    }}
                />
            </div>
        </NodeWrapper>
    );
});

export default DecimalDisplayNode;
