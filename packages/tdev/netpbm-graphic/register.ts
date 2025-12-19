import { rootStore } from '@tdev-stores/rootStore';
import { createModel } from './model';

const register = () => {
    rootStore.documentStore.registerFactory('netpbm_graphic', createModel);
};

register();
