import React from 'react';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import CmsText, { CmsTextMeta } from '@tdev-models/documents/CmsText';

interface CmsTextContextType {
    entries: { [key: string]: string };
}

export const CmsTextContext = React.createContext<CmsTextContextType | undefined>(undefined);

/**
 * @returns an existing, real CmsText document or undefined. (no dummy document is returned)
 */
export function useFirstCmsTextDocumentIfExists(id?: string): CmsText | undefined {
    const [meta] = React.useState(new CmsTextMeta({}));
    if (!id) {
        return undefined;
    }

    // Not using useFirstMainDocument() here because that would always supply a (dummy) document.
    const docRoot = useDocumentRoot(id, meta, false);
    return docRoot?.firstMainDocument;
}
