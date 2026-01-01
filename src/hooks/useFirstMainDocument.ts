import React from 'react';
import { DocumentType } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import { useStore } from '@tdev-hooks/useStore';
import { Config } from '@tdev-api/documentRoot';
import { useDummyId } from './useDummyId';

export const DUMMY_DOCUMENT_ID = 'dummy' as const;

/**
 * This hook provides access to the first main document of the rootDocument.
 * This is especially useful, when the DocumentType is expected to have only
 * one main document - like a TaskState.
 *
 * For bridging the time until the first main document is loaded,
 * a dummy document is provided in the meantime.
 */
export const useFirstMainDocument = <Type extends DocumentType>(
    documentRootId: string | undefined,
    meta: TypeMeta<Type>,
    createDocument: boolean = true,
    access: Partial<Config> = {}
) => {
    const defaultDocId = useDummyId(documentRootId);
    const documentRoot = useDocumentRoot(documentRootId, meta, true, access);
    const userStore = useStore('userStore');
    const documentStore = useStore('documentStore');
    const [dummyDocument] = React.useState(
        documentStore.createDocument({
            id: defaultDocId,
            type: meta.type,
            data: meta.defaultData,
            authorId: DUMMY_DOCUMENT_ID,
            documentRootId: documentRoot.id,
            parentId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })
    );
    React.useEffect(() => {
        if (!userStore.current || userStore.isUserSwitched) {
            /**
             * If the user is viewing another user, we should not create a document
             * and instead try to load the first main document of the viewed user.
             */
            return;
        }
        if (documentRoot.isLoaded && !documentRoot.isDummy && !documentRoot.firstMainDocument) {
            if (createDocument && documentRoot.hasAdminRWAccess) {
                documentStore.create(
                    {
                        documentRootId: documentRoot.id,
                        authorId: userStore.current.id,
                        type: meta.type,
                        data: meta.defaultData
                    },
                    true
                );
            }
        }
    }, [documentRoot, userStore.current, createDocument]);

    return documentRoot?.firstMainDocument || dummyDocument;
};
