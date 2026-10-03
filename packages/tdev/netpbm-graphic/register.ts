import { mdiCheckerboard } from '@mdi/js';
import { rootStore } from '@tdev-stores/rootStore';
import { createModel } from './model';

const register = () => {
    rootStore.documentStore.registerFactory('netpbm_graphic', createModel);
    rootStore.documentStore.registerFileExtension('netpbm_graphic', {
        extension: '.pbm',
        defaultData: { imageData: '' },
        icon: mdiCheckerboard,
        iconColor: '#65dbc7'
    });
};

register();
