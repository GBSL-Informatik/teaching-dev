import { rootStore } from '@tdev-stores/rootStore';
import SimpleChat from './components/SimpleChat/SimpleChat';
import { createModel as createSimpleChat } from './models/SimpleChat';
import { ModelMeta } from './models/SimpleChat/ModelMeta';
import { createModel as createTextMessage } from './models/TextMessage';

const register = () => {
    rootStore.documentStore.registerFactory('text_message', createTextMessage);
    rootStore.documentStore.registerFactory('simple_chat', createSimpleChat);
    rootStore.socketStore.registerRecordToCreate('text_message');
    rootStore.socketStore.registerRecordToCreate('simple_chat');
    rootStore.componentStore.registerContainerComponent('simple_chat', {
        defaultMeta: new ModelMeta({ name: 'Simple Chat' }),
        component: SimpleChat
    });
};

register();
