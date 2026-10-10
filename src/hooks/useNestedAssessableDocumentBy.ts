import type { AssessableType } from '@tdev-api/document';
import { Config } from '@tdev-api/documentRoot';
import { AssessableMeta } from '@tdev-models/documents/Assessable/AssessableMeta';
import { useFirstMainDocument } from './useFirstMainDocument';
import useLinkedMetaModel from './useLinkedMetaModel';
import { useUniqChildOfMainDocument } from './useUniqChildOfMainDocument';

const access = {} as Config;

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
    if (!qid) {
        return useFirstMainDocument(documentRootId, meta, true);
    }
    const doc = useUniqChildOfMainDocument<Type>(documentRootId, null, meta, qid);
    useLinkedMetaModel(doc, meta);
    return doc;
};
