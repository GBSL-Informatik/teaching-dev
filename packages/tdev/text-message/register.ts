import { rootStore } from '@tdev-stores/rootStore';
import { createModel as createTextMessage } from './models/TextMessage';
import { createModel as createSimpleChat } from './models/SimpleChat';
import SimpleChat from './components/SimpleChat/SimpleChat';

const register = () => {
    rootStore.documentStore.registerFactory('text_message', createTextMessage);
    rootStore.documentStore.registerFactory('simple_chat', createSimpleChat);
    rootStore.socketStore.registerRecordToCreate('text_message');
    rootStore.socketStore.registerRecordToCreate('simple_chat');
    // rootStore.componentStore.registerRoomComponent('text_messages', {
    //     name: 'Textnachrichten',
    //     description: 'Textnachrichten können in einem Chat versandt- und empfangen werden.',
    //     component: SimpleChat,
    //     default: true
    // });
};

register();
