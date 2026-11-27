import { rootStore } from '@tdev-stores/rootStore';
import DocumentView from './Component/DocumentView';
import { ExcalidrawColor, mdiExcalidraw } from './icons';
import { createModel } from './model';

const register = () => {
    rootStore.documentStore.registerDocumentType({
        type: 'excalidoc',
        factory: createModel,
        fileExtensions: [
            {
                name: 'Excalidraw',
                description: 'Für Skizzen und Diagramme',
                extension: '.excalidraw',
                icon: mdiExcalidraw,
                iconColor: ExcalidrawColor,
                priority: 6,
                defaultData: {
                    elements: [],
                    files: {},
                    image: ''
                }
            }
        ]
    });
    rootStore.componentStore.registerDocumentView('excalidoc', DocumentView);
};

register();
