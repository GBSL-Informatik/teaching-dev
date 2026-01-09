import { rootStore } from '@tdev-stores/rootStore';
import { createModel } from './model';
import TextMessages from './TextMessages';
import type { RoomComponent } from '@tdev-stores/ComponentStore';
import type { RoomFactory } from '@tdev-api/document';
import DynamicRoom from '@tdev-models/documents/DynamicRoom';

const createRoom: RoomFactory<'text_messages'> = (dynamicRoot, documentStore) => {
    return new DynamicRoom(dynamicRoot, documentStore);
};

const register = () => {
    rootStore.documentStore.registerFactory('text_message', createModel);
    rootStore.socketStore.registerRecordToCreate('text_message');
    rootStore.documentStore.registerRoomFactory('text_messages', createRoom);
    rootStore.componentStore.registerRoomComponent('text_messages', {
        name: 'Textnachrichten',
        description: 'Textnachrichten können in einem Chat versandt- und empfangen werden.',
        component: TextMessages,
        default: true
    } as RoomComponent);
};

register();
