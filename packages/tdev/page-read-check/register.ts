import { rootStore } from '@tdev-stores/rootStore';
import { createModel } from './model';
import { ModelMeta } from './model/ModelMeta';

const register = () => {
    rootStore.documentStore.registerDocumentType({
        type: 'page_read_check',
        factory: createModel,
        defaultMeta: new ModelMeta({}),
        taskable: true
    });
};

register();
