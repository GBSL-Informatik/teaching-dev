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
    HandleType
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { mdiWizardHat } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import DynamicDocumentRoot from '@tdev-models/documents/DynamicDocumentRoot';
import { RoomType } from '@tdev-api/document';
import { useStore } from '@tdev-hooks/useStore';

type OnReconnectEnd = (
    event: MouseEvent | TouchEvent,
    edge: Edge,
    handleType: HandleType,
    connectionState: FinalConnectionState
) => void;

type OnReconnectStart = (event: React.MouseEvent, edge: Edge, handleType: HandleType) => void;

interface Props {
    dynamicRoot: DynamicDocumentRoot<RoomType.Circuit>;
}

const Circuit = observer((props: Props): React.ReactNode => {
    const { dynamicRoot } = props;
    const documentStore = useStore('documentStore');
    const edgeReconnectSuccessful = React.useRef(true);
    const onChange = React.useCallback<OnNodesChange<Node>>(
        (change) => {
            dynamicRoot.room.onNodesChange(change);
        },
        [dynamicRoot.room]
    );
    const onChangeEdge = React.useCallback<OnEdgesChange<Edge>>(
        (change) => {
            dynamicRoot.room.onEdgeChange(change);
        },
        [dynamicRoot.room]
    );
    const onConnect = React.useCallback<OnConnect>(
        (connection) => {
            dynamicRoot.room.onConnect(connection);
        },
        [dynamicRoot.room]
    );
    const onReconnectStart = React.useCallback<OnReconnectStart>(() => {
        edgeReconnectSuccessful.current = false;
    }, []);

    const onReconnect = React.useCallback<OnReconnect>((oldEdge, newConnection) => {
        edgeReconnectSuccessful.current = true;
        // setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    }, []);

    const onReconnectEnd = React.useCallback<OnReconnectEnd>((_, edge) => {
        if (!edgeReconnectSuccessful.current) {
            const doc = documentStore.find(edge.id);
            if (doc) {
                documentStore.apiDelete(doc);
            }
        }

        edgeReconnectSuccessful.current = true;
    }, []);
    if (!dynamicRoot) {
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
                        nodes={dynamicRoot.room.nodes}
                        edges={dynamicRoot.room.edges}
                        onNodesChange={onChange}
                        onEdgesChange={onChangeEdge}
                        onConnect={onConnect}
                        onReconnect={onReconnect}
                        onReconnectStart={onReconnectStart}
                        onReconnectEnd={onReconnectEnd}
                        fitView
                    >
                        <MiniMap />
                        <Controls />
                        <Panel position="top-right">
                            <Button
                                icon={mdiWizardHat}
                                size={1}
                                color="blue"
                                onClick={() => {
                                    dynamicRoot.room.addFlowNode();
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
