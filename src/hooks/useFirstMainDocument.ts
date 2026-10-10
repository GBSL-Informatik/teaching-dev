import { DocumentType, TypeModelMapping } from '@tdev-api/document';
import { Config } from '@tdev-api/documentRoot';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import { useStore } from '@tdev-hooks/useStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { reaction } from 'mobx';
import React from 'react';
import { useDummyId } from './useDummyId';

export const DUMMY_DOCUMENT_ID = 'dummy' as const;

/**
 * This hook provides access to the first main document from the viewed user, of the given rootDocument.
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
    const createRequestedAt = React.useRef<number>(0);
    const defaultDocId = useDummyId(documentRootId);
    const documentRoot = useDocumentRoot(documentRootId, meta, true, access, false, loadOnlyType);
    const userStore = useStore('userStore');
    const documentStore = useStore('documentStore');
    const dummyDocument = React.useMemo(
        () =>
            documentStore.createDocument({
                id: defaultDocId,
                type: meta.type,
                data: meta.defaultData,
                authorId: DUMMY_DOCUMENT_ID,
                documentRootId: documentRoot.id,
                parentId: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }),
        [documentRoot.id]
    );
    React.useEffect(() => {
        if (!documentRoot) {
            return;
        }
        return reaction(
            () => documentRoot?._needsInitialDocumentCreation,
            (needsCreation) => {
                if (!needsCreation || !createDocument) {
                    return;
                }
                const now = Date.now();
                if (now - createRequestedAt.current < 1000) {
                    return;
                }
                if (!loadOnlyType || loadOnlyType === meta.type) {
                    createRequestedAt.current = Date.now();
                    documentStore.create({
                        documentRootId: documentRoot.id,
                        authorId: userStore.current!.id,
                        type: meta.type,
                        uniqOnRoot: 'main',
                        data: meta.defaultData
                    });
                }
            },
            { fireImmediately: true }
        );
    }, [userStore, createDocument, documentRoot]);
    return (documentRoot?.mainDocument as TypeModelMapping[Type]) || dummyDocument;
};
