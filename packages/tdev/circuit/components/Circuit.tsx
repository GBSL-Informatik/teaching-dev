import clsx from 'clsx';

import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import React from 'react';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import DocumentRoot from '@tdev-models/DocumentRoot';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    OnConnect,
    ControlButton,
    Panel,
    Edge,
    NodeChange
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import Icon from '@mdi/react';
import { mdiWizardHat } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import DynamicDocumentRoot from '@tdev-models/documents/DynamicDocumentRoot';
import { RoomType } from '@tdev-api/document';

const initialNodes = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } }
    // { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } }
];

// const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];
const initialEdges: Edge[] = [];

interface Props {
    dynamicRoot: DynamicDocumentRoot<RoomType.Circuit>;
}

const Circuit = observer((props: Props): React.ReactNode => {
    const { dynamicRoot } = props;

    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const onConnect = React.useCallback(
        (params: OnConnect['arguments']) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );
    const onChange = React.useCallback(
        (change: NodeChange[]) => {
            dynamicRoot.room.onNodesChange(change);
        },
        [dynamicRoot.room]
    );
    if (!dynamicRoot) {
        return null;
    }
    console.log('rerender', dynamicRoot.room.nodes);

    return (
        <div className={clsx(styles.wrapper)}>
            <div className={clsx(styles.rooms)}>
                <h1 className={clsx(styles.name)}>
                    {dynamicRoot.name} <PermissionsPanel documentRootId={dynamicRoot.rootDocumentId} />
                </h1>
                <div style={{ width: '100%', height: '80vh' }}>
                    <ReactFlow
                        nodes={dynamicRoot.room.nodes}
                        // nodes={nodes}
                        edges={edges}
                        onNodesChange={onChange}
                        // onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
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
