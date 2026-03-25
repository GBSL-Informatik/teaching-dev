import { rootStore } from '@tdev-stores/rootStore';
import { createModel } from './model';
import { ModelMeta } from './model/ModelMeta';

const register = () => {
    rootStore.documentStore.registerFactory('page_read_check', createModel);
    rootStore.componentStore.registerTaskableDocumentType(new ModelMeta({}));
};

register();
