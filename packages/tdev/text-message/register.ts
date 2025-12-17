import { rootStore } from '@tdev-stores/rootStore';
import { createModel } from './model';
import TextMessages from './TextMessages';

const register = () => {
    rootStore.documentStore.registerFactory('text_message', createModel);
    rootStore.socketStore.registerRecordToCreate('text_message');
    rootStore.componentStore.registerRoomComponent('text_messages', {
        name: 'Textnachrichten',
        description: 'Textnachrichten können in einem Chat versandt- und empfangen werden.',
        component: TextMessages,
        default: true
    });
};

register();
