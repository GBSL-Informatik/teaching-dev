import type { DocumentType, TypeModelMapping } from '@tdev-api/document';
import { Config } from '@tdev-api/documentRoot';
import { useStore } from '@tdev-hooks/useStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { useFirstMainDocument } from './useFirstMainDocument';

const access = {} as Config;

/**
 * This hook provides access to a unique child document based on the provided criteria.
 * It ensures that only one document of the specified type exists under the given parent.
 *
 * For bridging the time until the first main document is loaded,
 * a dummy document is provided in the meantime.
 */
export const useOrAwaitFirstMainDocument = <Type extends DocumentType>(
    documentRootId: string | undefined,
    meta: TypeMeta<Type> | null,
    createDocument: boolean = true,
    access: Partial<Config> = {},
    loadOnlyType?: DocumentType
) => {
    const documentRootStore = useStore('documentRootStore');
    if (!meta && !documentRootId) {
        return null;
    }
    if (!meta) {
        const root = documentRootStore.find(documentRootId);
        return (root?.mainDocument as TypeModelMapping[Type]) || null;
    }
    const mainDocument = useFirstMainDocument<Type>(
        documentRootId,
        meta,
        createDocument,
        access,
        loadOnlyType
    );
    return mainDocument;
};
