import { rootStore } from '@tdev-stores/rootStore';
import { createModel } from './model';

const register = () => {
    rootStore.documentStore.registerFactory('text_message', createModel);
    rootStore.socketStore.registerRecordToCreate('text_message');
};

register();
