import { rootStore } from '@tdev-stores/rootStore';
import { createModel } from './model';

const register = () => {
    rootStore.documentStore.registerFactory('page_read_check', createModel);
};

register();
