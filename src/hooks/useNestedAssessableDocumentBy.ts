import type { AssessableType, AssessableTypeModelMapping } from '@tdev-api/document';
import { Config } from '@tdev-api/documentRoot';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import { useStore } from '@tdev-hooks/useStore';
import { AssessableMeta } from '@tdev-models/documents/Assessable/AssessableMeta';
import { reaction } from 'mobx';
import React from 'react';
import { useDummyId } from './useDummyId';
import { DUMMY_DOCUMENT_ID } from './useFirstMainDocument';
import useLinkedMetaModel from './useLinkedMetaModel';

const access = {} as Config;

const requested = new Set<string>();

/**
 * This hook provides access to the first main document of the rootDocument.
 * This is especially useful, when the DocumentType is expected to have only
 * one main document - like a TaskState.
 *
 * For bridging the time until the first main document is loaded,
 * a dummy document is provided in the meantime.
 */
export const useNestedAssessableDocumentBy = <Type extends AssessableType>(
    documentRootId: string | undefined,
    /** ensure to put meta in a React.useState */
    meta: AssessableMeta<Type>,
    /** ensure to put the selector in a React.useCallback */
    qid: string | undefined
) => {
    const createRequestedAt = React.useRef<number>(0);
    const requestedId = React.useRef<string | null>(null);

    // // when inside a quizz, this will share the document root with the quiz
    const defaultDocId = useDummyId(documentRootId);
    // if qid is provided, we are in e.g. a quiz and don't want to create a new document, since the quiz should already have created it.
    const skipCreate = !!qid;
    const documentRoot = useDocumentRoot(documentRootId, meta, true, access, skipCreate);
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
            }) as AssessableTypeModelMapping[Type],
        [meta.type, defaultDocId, meta.defaultData]
    );

    React.useEffect(() => {
        if (!documentRoot) {
            return;
        }
        return reaction(
            () => {
                if (!documentRoot?._canInitializeDocuments) {
                    return false;
                }
                if (!qid) {
                    return !documentRoot?.mainDocument;
                }
                return !documentRoot?.documents?.find((d) => d.type === meta.type && d.uniqOnParent === qid);
            },
            (needsCreation) => {
                if (!needsCreation) {
                    return;
                }
                const now = Date.now();
                if (requestedId.current === documentRoot.id && now - createRequestedAt.current < 1000) {
                    return;
                }
                requestedId.current = documentRoot.id;
                createRequestedAt.current = now;
                documentStore.create({
                    documentRootId: documentRoot.id,
                    authorId: userStore.current!.id,
                    type: meta.type,
                    data: meta.defaultData,
                    uniqOnRoot: qid ? undefined : 'main',
                    uniqOnParent: qid
                });
            },
            { fireImmediately: true }
        );
    }, [userStore, documentRoot]);
    const firstDoc = qid
        ? documentRoot.documents.find((d) => d.type === meta.type && d.uniqOnParent === qid)
        : documentRoot.mainDocument;
    const doc = (firstDoc || dummyDocument) as AssessableTypeModelMapping[Type];

    useLinkedMetaModel(doc, meta);
    return doc;
};
