import { ReactFlowInstance, Node } from '@xyflow/react';
import { useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CircuitRoom from '../../models/CircuitRoom';
import { transaction } from 'mobx';
import { FlowNodeData, NodeType } from '../..';

export const useCopyPaste = (room: CircuitRoom | null) => {
    const onCopyCapture = useCallback(
        (event: ClipboardEvent) => {
            event.preventDefault();
            const nodes = JSON.stringify(
                room?.selectedNodes?.filter((n) => n.node.selected).map((n) => n.node) || []
            );
            console.log('copy nodes', nodes, !!room, room?.selectedNodes);

            event.clipboardData?.setData('flowchart:nodes', nodes);
        },
        [room]
    );

    const onPasteCapture = useCallback(
        (event: ClipboardEvent) => {
            event.preventDefault();
            const nodes = JSON.parse(event.clipboardData?.getData('flowchart:nodes') || '[]') as
                | Node[]
                | undefined;
            if (nodes && nodes.length > 0) {
                const currentSelection = room?.selectedNodes || [];
                const copies = nodes.map((n) => {
                    const newNode = {
                        ...n,
                        selected: true,
                        position: { x: n.position.x + 40, y: n.position.y + 40 }
                    } as Omit<FlowNodeData<NodeType>, 'id'>;
                    delete (newNode as any).id;
                    return newNode;
                });
                transaction(() => {
                    currentSelection.forEach((n) => n.setSelected(false));
                    copies.forEach((n) => {
                        room?.createFlowNode(n);
                    });
                });
            }
        },
        [room]
    );

    useEffect(() => {
        window.addEventListener('copy', onCopyCapture);
        return () => {
            window.removeEventListener('copy', onCopyCapture);
        };
    }, [onCopyCapture]);

    useEffect(() => {
        window.addEventListener('paste', onPasteCapture);
        return () => {
            window.removeEventListener('paste', onPasteCapture);
        };
    }, [onPasteCapture]);
};
