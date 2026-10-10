import { useGlobalFirstMainDocument } from '@tdev-hooks/useGlobalFirstMainDocument';
import CmsText, { CmsTextMeta } from '@tdev-models/documents/CmsText';
import React from 'react';

interface CmsTextContextType {
    entries: { [key: string]: string };
}

export const CmsTextContext = React.createContext<CmsTextContextType | undefined>(undefined);
const CmsMeta = new CmsTextMeta({});

/**
 * @returns an existing, real CmsText document or undefined. (no dummy document is returned)
 */
export function useFirstCmsTextDocumentIfExists(id?: string): CmsText | undefined {
    if (!id) {
        return undefined;
    }
    const doc = useGlobalFirstMainDocument(id, CmsMeta, false, true);
    if (doc.isDummy) {
        return;
    }
    return doc;
}
