import { rootStore } from '@tdev-stores/rootStore';
import Excalidoc from './model';
import type { Document, DocumentType } from '@tdev-api/document';

export const createModel = (data: Document<DocumentType>, store: typeof rootStore.documentStore) => {
    return new Excalidoc(data as Document<'excalidoc'>, store);
};

const register = () => {
    rootStore.documentStore.registerFactory(
        'excalidoc',
        (data: Document<DocumentType>, store: typeof rootStore.documentStore) =>
            new Excalidoc(data as Document<'excalidoc'>, store)
    );
};

register();
