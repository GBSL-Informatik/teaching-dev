import { DocumentType } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { useFirstMainDocument } from './useFirstMainDocument';
import { Config } from '@tdev-api/documentRoot';

/**
 * This hook provides access to the first main document of the rootDocument.
 * This is especially useful, when the DocumentType is expected to have only
 * one main document - like a TaskState.
 *
 * Note: This hook is a wrapper around useFirstMainDocument but does not return a dummy document
 *       (or a document linked to a dummyRootDocument) when **a documentRootId was provided** and
 *       the session store reports a logged in user.
 */
export const useFirstRealMainDocument = <Type extends DocumentType>(
    documentRootId: string | undefined,
    meta: TypeMeta<Type>,
    createDocument: boolean = true,
    access: Partial<Config> = {},
    loadOnlyType?: DocumentType
) => {
    const mainDoc = useFirstMainDocument(documentRootId, meta, createDocument, access, loadOnlyType);

    if (!documentRootId) {
        return mainDoc;
    }

    if (!mainDoc || mainDoc.isDummy) {
        return;
    }

    return mainDoc;
};
