import { DocumentType, TypeModelMapping } from '@tdev-api/document';
import { Config } from '@tdev-api/documentRoot';
import { type default as DocumentRoot, TypeMeta } from '@tdev-models/DocumentRoot';
import { useFirstMainDocument } from './useFirstMainDocument';

export const DUMMY_DOCUMENT_ID = 'dummy' as const;

/**
 * This hook provides access to the first main document (personal or shared) of the rootDocument.
 */
export const useGlobalFirstMainDocument = <Type extends DocumentType>(
    documentRootId: string | undefined,
    meta: TypeMeta<Type>,
    createDocument: boolean = true,
    preferUsersMain: boolean = false,
    access: Partial<Config> = {},
    loadOnlyType?: DocumentType
): TypeModelMapping[Type] => {
    const usersFirstMainDocument = useFirstMainDocument(
        documentRootId,
        meta,
        createDocument,
        access,
        loadOnlyType
    );
    const root = usersFirstMainDocument.root as DocumentRoot<Type> | undefined;
    if (!root) {
        return usersFirstMainDocument;
    }
    const typeMismatch = root.type !== meta.type;
    if (typeMismatch) {
        const candidates = root.mainConstrainedDocuments.filter(
            (doc) => doc.type === meta.type
        ) as TypeModelMapping[Type][];
        if (preferUsersMain) {
            const usersMain = candidates.find((d) => d.authorId === root.viewedUserId);
            if (usersMain) {
                return usersMain;
            }
        }
        return candidates[0] ?? usersFirstMainDocument;
    }
    if (preferUsersMain && root.mainDocument) {
        return root.mainDocument;
    }
    return root.mainDocuments[0] ?? usersFirstMainDocument;
};
