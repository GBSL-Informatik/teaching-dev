import { rootStore } from '@tdev-stores/rootStore';
import SimpleChat from './components/SimpleChat/SimpleChat';
import { createModel as createSimpleChat } from './models/SimpleChat';
import { ModelMeta } from './models/SimpleChat/ModelMeta';
import { createModel as createTextMessage } from './models/TextMessage';

const register = () => {
    rootStore.documentStore.registerDocumentType({
        type: 'text_message',
        factory: createTextMessage,
        createOnNewRecord: true
    });
    rootStore.documentStore.registerDocumentType({
        type: 'simple_chat',
        factory: createSimpleChat,
        createOnNewRecord: true
    });
    rootStore.componentStore.registerContainerComponent('simple_chat', {
        defaultMeta: new ModelMeta({ name: 'Simple Chat' }),
        component: SimpleChat
    });
};

register();
