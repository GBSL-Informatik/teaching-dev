import React from 'react';
import type { AssessableType, AssessableTypeModelMapping, DocumentModelType } from '@tdev-api/document';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import { useStore } from '@tdev-hooks/useStore';
import { Config } from '@tdev-api/documentRoot';
import { useDummyId } from './useDummyId';
import { reaction } from 'mobx';
import { DUMMY_DOCUMENT_ID } from './useFirstMainDocument';
import { AssessableMeta } from '@tdev-models/documents/Assessable/AssessableMeta';
import useLinkedMetaModel from './useLinkedMetaModel';
import _ from 'es-toolkit/compat';

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
    // // when inside a quizz, this will share the document root with the quiz
    const selector = React.useCallback(
        (doc: DocumentModelType) => {
            if (qid) {
                return doc.type === meta.type && doc.data.qid === qid;
            }
            return doc.type === meta.type;
        },
        [meta.type, qid]
    );
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
        [meta.type, defaultDocId, documentRoot.id, meta.defaultData]
    );

    const [canRequest, setCanRequest] = React.useState(false);
    React.useEffect(() => {
        if (!documentRoot) {
            return;
        }
        const timeoutId = setTimeout(() => {
            setCanRequest(true);
        }, 25);
        return () => {
            clearTimeout(timeoutId);
        };
    }, [documentRoot]);

    React.useEffect(() => {
        if (!documentRoot || !canRequest) {
            return;
        }
        return reaction(
            () => {
                if (!documentRoot?._canInitializeDocuments) {
                    return false;
                }
                const byType = documentRoot.documentsByType.get(meta.type);
                return !byType?.find(selector);
            },
            (needsCreation) => {
                if (!needsCreation) {
                    return;
                }
                const key = `${documentRoot.id}::${userStore.current!.id}::${meta.type}::${qid}`;
                if (requested.has(key)) {
                    return;
                }
                requested.add(key);
                documentStore
                    .create({
                        documentRootId: documentRoot.id,
                        authorId: userStore.current!.id,
                        type: meta.type,
                        data: meta.defaultData
                    })
                    .then(() => {
                        requested.delete(key);
                    });
            },
            { fireImmediately: true }
        );
    }, [userStore, documentRoot, canRequest]);
    const byType = documentRoot?.documentsByType.get(meta.type);
    const firstDoc = byType?.find(selector) as AssessableTypeModelMapping[Type] | undefined;
    const doc = firstDoc || dummyDocument;

    useLinkedMetaModel(doc, meta);
    return doc;
};
