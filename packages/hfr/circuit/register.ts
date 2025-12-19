import { rootStore } from '@tdev-stores/rootStore';
import { createModel as createFlowNode } from './models/FlowNode';
import { createModel as createFlowEdge } from './models/FlowEdge';
import Circuit from './components/Circuit';
import { createRoom } from './models/CircuitRoom';
import { RoomComponent } from '@tdev-stores/ComponentStore';

const register = () => {
    rootStore.documentStore.registerFactory('flow_node', createFlowNode);
    rootStore.documentStore.registerFactory('flow_edge', createFlowEdge);
    rootStore.documentStore.registerRoomFactory('circuit', createRoom);
    rootStore.socketStore.registerRecordToCreate('flow_node');
    rootStore.socketStore.registerRecordToCreate('flow_edge');
    rootStore.componentStore.registerRoomComponent('circuit', {
        name: 'Schaltkreis',
        description: 'Interaktive Schaltkreise erzeugen.',
        component: Circuit,
        default: true
    } as RoomComponent<'circuit'>);
};

register();
