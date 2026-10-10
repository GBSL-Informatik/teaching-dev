import type { DocumentType, TypeModelMapping } from '@tdev-api/document';
import { Config } from '@tdev-api/documentRoot';
import { useStore } from '@tdev-hooks/useStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { reaction } from 'mobx';
import React from 'react';
import { isDummyId, useDummyId } from './useDummyId';
import { DUMMY_DOCUMENT_ID } from './useFirstMainDocument';
import { useOrAwaitFirstMainDocument } from './useOrAwaitFirstMainDocument';

const access = {} as Config;

/**
 * This hook provides access to a unique child document based on the provided criteria.
 * It ensures that only one document of the specified type exists under the given parent.
 *
 * For bridging the time until the first main document is loaded,
 * a dummy document is provided in the meantime.
 */
export const useUniqChildOfMainDocument = <Type extends DocumentType>(
    documentRootId: string | undefined,
    mainMeta: TypeMeta<DocumentType> | null,
    /** ensure to put meta in a React.useState */
    meta: TypeMeta<Type>,
    /** uniqueness key for the child document (scoped by type and user) */
    uniqOnParentKey: string
) => {
    const createRequestedAt = React.useRef<number>(0);
    const mainDocument = useOrAwaitFirstMainDocument<DocumentType>(documentRootId, mainMeta, true);
    const defaultRootDocId = useDummyId(documentRootId);
    const defaultDocId = useDummyId(documentRootId);
    const documentStore = useStore('documentStore');
    const documentRootStore = useStore('documentRootStore');
    const dummyDocument = React.useMemo(
        () =>
            documentStore.createDocument({
                id: defaultDocId,
                type: meta.type,
                data: meta.defaultData,
                authorId: DUMMY_DOCUMENT_ID,
                documentRootId: documentRootId ?? defaultRootDocId,
                parentId: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }) as TypeModelMapping[Type],
        [meta.type, defaultDocId, meta.defaultData]
    );

    React.useEffect(() => {
        return reaction(
            () => documentRootStore.find(documentRootId)?.mainDocument,
            (mainDoc) => {
                const isDummy = !mainDoc || mainDoc.isDummy || isDummyId(mainDoc.id);
                if (isDummy || !documentRootId || !mainDoc.root?._canInitializeDocuments) {
                    return;
                }
                const existingChild = mainDoc.children.find(
                    (d) => d.type === meta.type && d.uniqOnParent === uniqOnParentKey
                );
                const now = Date.now();
                if (existingChild || now - createRequestedAt.current < 200) {
                    return;
                }

                createRequestedAt.current = now;
                console.log('!creating child document', uniqOnParentKey, documentRootId);
                documentStore.create({
                    documentRootId: documentRootId,
                    type: meta.type,
                    data: meta.defaultData,
                    parentId: mainDoc.id,
                    uniqOnParent: uniqOnParentKey
                });
            },
            { fireImmediately: true }
        );
    }, [documentRootId, uniqOnParentKey, meta.type]);

    const firstDoc = mainDocument?.children.find(
        (d) => d.type === meta.type && d.uniqOnParent === uniqOnParentKey
    );
    const doc = (firstDoc || dummyDocument) as TypeModelMapping[Type];

    return doc;
};
