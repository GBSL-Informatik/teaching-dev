import { ReactFlowInstance, Node, Edge } from '@xyflow/react';
import { useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CircuitRoom from '../../models/CircuitRoom';
import { transaction } from 'mobx';
import { FlowEdgeData, FlowNodeData, NodeType } from '../..';
import FlowEdge from '../../models/FlowEdge';

export const useCopyPaste = (room: CircuitRoom | null) => {
    const onCopyCapture = useCallback(
        (event: ClipboardEvent) => {
            event.preventDefault();
            const nodes = JSON.stringify({
                nodes: room?.selectedNodes?.map((n) => n.node) || [],
                edges: room?.selectedEdges?.map((e) => e.edgeData) || []
            });
            event.clipboardData?.setData('xyflow', nodes);
        },
        [room]
    );

    const onPasteCapture = useCallback(
        (event: ClipboardEvent) => {
            event.preventDefault();
            const data = JSON.parse(
                event.clipboardData?.getData('xyflow') || '{"nodes": [], "edges": []}'
            ) as { nodes: Node[] | undefined; edges: Edge[] | undefined };
            const { nodes, edges } = data;
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
                    Promise.all(copies.map((n) => room?.createFlowNode(n))).then((created) => {
                        const idMap = new Map<string, string>();
                        created.forEach((n, i) => {
                            if (!n) {
                                return;
                            }
                            idMap.set(nodes[i].id, n.id);
                            return n;
                        });
                        const promises: Promise<FlowEdge | void>[] = [];
                        transaction(() => {
                            (edges || []).forEach((e) => {
                                const sourceId = idMap.get(e.source);
                                const targetId = idMap.get(e.target);
                                if (sourceId && targetId) {
                                    const res = room?.createFlowEdge({
                                        ...e,
                                        source: sourceId,
                                        target: targetId
                                    });
                                    if (res) {
                                        promises.push(res);
                                    }
                                }
                            });
                        });
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
