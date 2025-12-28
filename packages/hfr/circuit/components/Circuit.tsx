import clsx from 'clsx';

import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import React from 'react';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import { Background, ReactFlow, MiniMap, Controls, Panel } from '@xyflow/react';
import type {
    OnConnect,
    Edge,
    OnEdgesChange,
    OnNodesChange,
    Node,
    OnReconnect,
    FinalConnectionState,
    HandleType,
    OnNodesDelete
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { mdiCarBattery, mdiElectricSwitch, mdiLedOn } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { useStore } from '@tdev-hooks/useStore';
import { nodeTypes } from './Nodes';
import { NodeType } from '@hfr/circuit';
import { DynamicRoomProps } from '@tdev-stores/ComponentStore';

type OnReconnectEnd = (
    event: MouseEvent | TouchEvent,
    edge: Edge,
    handleType: HandleType,
    connectionState: FinalConnectionState
) => void;

type OnReconnectStart = (event: React.MouseEvent, edge: Edge, handleType: HandleType) => void;

const Circuit = observer((props: DynamicRoomProps<'circuit'>): React.ReactNode => {
    const { dynamicRoot } = props;
    const documentStore = useStore('documentStore');
    const edgeReconnectSuccessful = React.useRef(true);
    const onChange = React.useCallback<OnNodesChange<Node>>(
        (change) => {
            dynamicRoot.room!.onNodesChange(change);
        },
        [dynamicRoot.room]
    );
    const onChangeEdge = React.useCallback<OnEdgesChange<Edge>>(
        (change) => {
            dynamicRoot.room!.onEdgeChange(change);
        },
        [dynamicRoot.room]
    );
    const onConnect = React.useCallback<OnConnect>(
        (connection) => {
            dynamicRoot.room!.onConnect(connection);
        },
        [dynamicRoot.room]
    );
    const onNodesDelete = React.useCallback<OnNodesDelete>(
        (deleted) => {
            edgeReconnectSuccessful.current = true;
            dynamicRoot.room!.onDelete(deleted);
        },
        [dynamicRoot.room]
    );
    const onReconnectStart = React.useCallback<OnReconnectStart>(() => {
        edgeReconnectSuccessful.current = false;
    }, []);

    const onReconnect = React.useCallback<OnReconnect>(
        (oldEdge, newConnection) => {
            edgeReconnectSuccessful.current = true;
            dynamicRoot.room!.reconnectEdge(oldEdge.id, newConnection);
        },
        [dynamicRoot.room]
    );

    const onReconnectEnd = React.useCallback<OnReconnectEnd>((_, edge) => {
        if (!edgeReconnectSuccessful.current) {
            const doc = documentStore.find(edge.id);
            if (doc) {
                documentStore.apiDelete(doc);
            }
        }

        edgeReconnectSuccessful.current = true;
    }, []);
    if (!dynamicRoot || !dynamicRoot.room) {
        return null;
    }

    return (
        <div className={clsx(styles.wrapper)}>
            <div className={clsx(styles.rooms)}>
                <h1 className={clsx(styles.name)}>
                    {dynamicRoot.name} <PermissionsPanel documentRootId={dynamicRoot.rootDocumentId} />
                </h1>
                <div style={{ width: '100%', height: '80vh' }}>
                    <ReactFlow
                        nodeTypes={nodeTypes}
                        nodes={dynamicRoot.room!.nodes}
                        edges={dynamicRoot.room!.edges}
                        onNodesDelete={onNodesDelete}
                        onNodesChange={onChange}
                        onEdgesChange={onChangeEdge}
                        onConnect={onConnect}
                        onReconnect={onReconnect}
                        onReconnectStart={onReconnectStart}
                        onReconnectEnd={onReconnectEnd}
                        fitView
                        minZoom={0.1}
                        maxZoom={4}
                        snapToGrid={true}
                        snapGrid={[10, 10]}
                        proOptions={{ hideAttribution: true }}
                    >
                        <MiniMap />
                        <Controls />
                        <Panel position="top-right" className={clsx(styles.panel)}>
                            <Button
                                icon={mdiElectricSwitch}
                                size={1}
                                color="blue"
                                onClick={() => {
                                    dynamicRoot.room!.addFlowNode(NodeType.SwitchNode, { power: 0 });
                                }}
                            />
                            <Button
                                text="OR"
                                size={1}
                                color="blue"
                                onClick={() => {
                                    dynamicRoot.room!.addFlowNode(NodeType.OrNode, {});
                                }}
                            />
                            <Button
                                text="XOR"
                                size={1}
                                color="blue"
                                onClick={() => {
                                    dynamicRoot.room!.addFlowNode(NodeType.XorNode, {});
                                }}
                            />
                            <Button
                                text="AND"
                                size={1}
                                color="blue"
                                onClick={() => {
                                    dynamicRoot.room!.addFlowNode(NodeType.AndNode, {});
                                }}
                            />
                            <Button
                                text="123"
                                size={1}
                                color="blue"
                                onClick={() => {
                                    dynamicRoot.room!.addFlowNode(NodeType.DecimalDisplayNode, { pins: 4 });
                                }}
                            />
                            <Button
                                text="NOT"
                                size={1}
                                color="blue"
                                onClick={() => {
                                    dynamicRoot.room!.addFlowNode(NodeType.NotNode, {});
                                }}
                            />
                            <Button
                                icon={mdiLedOn}
                                size={1}
                                color="blue"
                                onClick={() => {
                                    dynamicRoot.room!.addFlowNode(NodeType.LedNode, {});
                                }}
                            />
                            <Button
                                icon={mdiCarBattery}
                                size={1}
                                color="blue"
                                onClick={() => {
                                    dynamicRoot.room!.addFlowNode(NodeType.BatteryNode, { pins: 5 });
                                }}
                            />
                        </Panel>
                        <Background />
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
});
export default Circuit;
