import { mdiCheckerboard } from '@mdi/js';
import { rootStore } from '@tdev-stores/rootStore';
import { createModel } from './model';
import DocumentView from './NetpbmEditor/DocumentView';

const DEFAULT_IMAGE = `P1
3 3
0 1 0
1 0 1
0 1 0` as const;

const register = () => {
    rootStore.documentStore.registerFactory('netpbm_graphic', createModel);
    rootStore.documentStore.registerFileExtension('netpbm_graphic', {
        extension: '.pbm',
        defaultData: { imageData: DEFAULT_IMAGE },
        icon: mdiCheckerboard,
        iconColor: '#65dbc7'
    });
    rootStore.componentStore.registerDocumentView('netpbm_graphic', DocumentView);
};

register();
