import React, { useId } from 'react';
import { Access, DocumentType } from '../api/document';
import { rootStore } from '../stores/rootStore';
import DocumentRoot, { TypeMeta } from '../models/DocumentRoot';

/**
 * 1. create a dummy documentRoot with default (meta) data
 * 2. create a dummy document with default (meta) data
 * 2. when component mounts, check if the documentRoot is already in the store
 * 3. if not
 *  3.1. add the dummy document to the store
 *  3.2. add the dummy documentRoot to the store
 *  3.3. if an id was provided, load or create the documentRoot and it's documents from the api
 *  3.4. cleanup the dummy document
 */
export const useDocumentRoot = <Type extends DocumentType>(id: string | undefined, meta: TypeMeta<Type>) => {
    const defaultRootDocId = useId();
    const [dummyDocumentRoot] = React.useState<DocumentRoot<Type>>(
        new DocumentRoot(
            { id: id || defaultRootDocId, access: Access.RW, sharedAccess: Access.None },
            meta,
            rootStore.documentRootStore,
            true
        )
    );
    /**
     * only run the effect after the initial render to avoid
     * unnecessary api calls and delays
     */
    const [initRender, setInitRender] = React.useState(false);

    /** initial load */
    React.useEffect(() => {
        if (!initRender) {
            return;
        }
        const { documentRootStore } = rootStore;
        const rootDoc = documentRootStore.find(dummyDocumentRoot.id);
        if (rootDoc) {
            return;
        }
        documentRootStore.addDocumentRoot(dummyDocumentRoot);
        if (!id) {
            return;
        }

        /**
         * load the documentRoot and it's documents from the api.
         */
        documentRootStore
            .load(id, meta)
            .then((docRoot) => {
                if (!docRoot) {
                    return documentRootStore.create(id, meta, {});
                }
                return docRoot;
            })
            .then((docRoot) => {
                if (docRoot) {
                    if (
                        docRoot.permission === Access.RW &&
                        rootStore.userStore.current &&
                        !docRoot.firstMainDocument
                    ) {
                        rootStore.documentStore.create({
                            documentRootId: docRoot.id,
                            authorId: rootStore.userStore.current.id,
                            type: docRoot.type,
                            data: meta.defaultData
                        });
                    }
                }
            })
            .catch((err) => {
                /**
                 * could land here, when two users try to create the same document root
                 * at the same time
                 */
                console.log('err loading', err);
            });
    }, [initRender, rootStore]);

    React.useEffect(() => {
        setInitRender(true);
        return () => {
            rootStore.documentRootStore.removeFromStore(defaultRootDocId, false);
        };
    }, []);

    return rootStore.documentRootStore.find<Type>(dummyDocumentRoot.id) || dummyDocumentRoot;
};
