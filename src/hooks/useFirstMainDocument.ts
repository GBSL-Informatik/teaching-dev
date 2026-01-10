import React from 'react';
import { DocumentType } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import { useStore } from '@tdev-hooks/useStore';
import { Config } from '@tdev-api/documentRoot';
import { useDummyId } from './useDummyId';
import { reaction } from 'mobx';

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
    access: Partial<Config> = {},
    loadOnlyType?: DocumentType
) => {
    const defaultDocId = useDummyId(documentRootId);
    const documentRoot = useDocumentRoot(documentRootId, meta, true, access, undefined, loadOnlyType);
    const userStore = useStore('userStore');
    const documentStore = useStore('documentStore');
    const documentRootStore = useStore('documentRootStore');
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
        if (!documentRootId) {
            return;
        }
        return reaction(
            () => documentRootStore.find(documentRootId)?._needsInitialDocumentCreation,
            (needsCreation) => {
                if (!needsCreation) {
                    return;
                }
                if (needsCreation) {
                    if (createDocument && (!loadOnlyType || loadOnlyType === meta.type)) {
                        documentStore.create(
                            {
                                documentRootId: documentRootId,
                                authorId: userStore.current!.id,
                                type: meta.type,
                                data: meta.defaultData
                            },
                            true
                        );
                    }
                }
            },
            { fireImmediately: true }
        );
    }, [userStore, createDocument, documentRootId]);

    return documentRoot?.firstMainDocument || dummyDocument;
};
