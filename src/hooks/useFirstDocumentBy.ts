import React from 'react';
import type { DocumentModelType, DocumentType, TypeModelMapping } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import { useStore } from '@tdev-hooks/useStore';
import { Config } from '@tdev-api/documentRoot';
import { useDummyId } from './useDummyId';
import { reaction } from 'mobx';
import { DUMMY_DOCUMENT_ID } from './useFirstMainDocument';

/**
 * This hook provides access to the first main document of the rootDocument.
 * This is especially useful, when the DocumentType is expected to have only
 * one main document - like a TaskState.
 *
 * For bridging the time until the first main document is loaded,
 * a dummy document is provided in the meantime.
 */
export const useFirstDocumentBy = <Type extends DocumentType>(
    documentRootId: string | undefined,
    /** ensure to put meta in a React.useState */
    meta: TypeMeta<Type>,
    /** ensure to put the selector in a React.useCallback */
    selector: (doc: DocumentModelType) => boolean,
    createDocument: boolean = true,
    access: Partial<Config> = {},
    loadOnlyType?: DocumentType
) => {
    const defaultDocId = useDummyId(documentRootId);
    const documentRoot = useDocumentRoot(documentRootId, meta, true, access, false, loadOnlyType);
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
        if (!documentRoot) {
            return;
        }
        return reaction(
            () =>
                documentRoot?._canInitializeDocuments && !documentRoot.documents.some((doc) => selector(doc)),
            (needsCreation) => {
                if (!needsCreation || !createDocument) {
                    return;
                }
                if (!loadOnlyType || loadOnlyType === meta.type) {
                    documentStore.create(
                        {
                            documentRootId: documentRoot.id,
                            authorId: userStore.current!.id,
                            type: meta.type,
                            data: meta.defaultData
                        },
                        true
                    );
                }
            },
            { fireImmediately: true }
        );
    }, [userStore, createDocument, documentRoot, selector]);

    const firstDoc = documentRoot?.documents.find(selector) as TypeModelMapping[Type] | undefined;

    return firstDoc || dummyDocument;
};
