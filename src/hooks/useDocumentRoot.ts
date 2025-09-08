import React from 'react';
import { Access, DocumentType } from '@tdev-api/document';
import DocumentRoot, { TypeMeta } from '@tdev-models/DocumentRoot';
import { useStore } from '@tdev-hooks/useStore';
import { Config } from '@tdev-api/documentRoot';
import { useDummyId } from './useDummyId';

/**
 * 1. create a dummy documentRoot with default (meta) data
 * 2. create a dummy document with default (meta) data
 * 3. when component mounts, check if the documentRoot is already in the store
 * 4. if not:
 *      1. add the dummy document to the store
 *      2. add the dummy documentRoot to the store
 *      3. if an id was provided, load or create the documentRoot and it's documents from the api
 *      4. cleanup the dummy document
 */
export const useDocumentRoot = <Type extends DocumentType>(
    id: string | undefined,
    meta: TypeMeta<Type>,
    addDummyToStore: boolean = true,
    access: Partial<Config> = {},
    skipCreate?: boolean
) => {
    const defaultRootDocId = useDummyId();
    const userStore = useStore('userStore');
    const documentRootStore = useStore('documentRootStore');
    const [dummyDocumentRoot] = React.useState<DocumentRoot<Type>>(
        new DocumentRoot(
            {
                id: id || defaultRootDocId,
                access: Access.RW_DocumentRoot,
                sharedAccess: Access.None_DocumentRoot
            },
            meta,
            documentRootStore,
            true
        )
    );

    /** initial load */
    React.useEffect(() => {
        const rootDoc = documentRootStore.find(dummyDocumentRoot.id);
        if (rootDoc) {
            return;
        }
        if (addDummyToStore) {
            documentRootStore.addDocumentRoot(dummyDocumentRoot);
        }
        if (!id) {
            dummyDocumentRoot.setLoaded();
            return;
        }

        /**
         * load the documentRoot and it's documents from the api.
         */
        documentRootStore.loadInNextBatch(id, meta, { skipCreate: !!skipCreate }, access);
        return () => {
            documentRootStore.removeFromStore(defaultRootDocId, false);
        };
    }, [documentRootStore]);

    React.useEffect(() => {
        if (!userStore.isUserSwitched || !id) {
            return;
        }
        documentRootStore.loadInNextBatch(id, meta, {
            documentRoot: false,
            skipCreate: true
        });
    }, [userStore.viewedUser]);

    return documentRootStore.find<Type>(dummyDocumentRoot.id) || dummyDocumentRoot;
};
