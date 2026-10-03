import { rootStore } from '@tdev-stores/rootStore';
import { mdiExcalidraw } from './Component';
import { createModel } from './model';

const register = () => {
    rootStore.documentStore.registerFactory('excalidoc', createModel);
    rootStore.documentStore.registerFileExtension('excalidoc', {
        extension: '.excalidraw',
        icon: mdiExcalidraw,
        iconColor: '#6965db',
        defaultData: {
            elements: [],
            files: {},
            image: ''
        }
    });
};

register();
