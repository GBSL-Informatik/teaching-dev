import { rootStore } from '@tdev-stores/rootStore';
import { mdiExcalidraw } from './Component';
import DocumentView from './Component/DocumentView';
import { createModel } from './model';

const register = () => {
    rootStore.documentStore.registerFactory('excalidoc', createModel);
    rootStore.documentStore.registerFileExtension('excalidoc', {
        name: 'Excalidraw',
        description: 'Für Skizzen und Diagramme',
        extension: '.excalidraw',
        icon: mdiExcalidraw,
        iconColor: '#6965db',
        priority: 6,
        defaultData: {
            elements: [],
            files: {},
            image: ''
        }
    });
    rootStore.componentStore.registerDocumentView('excalidoc', DocumentView);
};

register();
