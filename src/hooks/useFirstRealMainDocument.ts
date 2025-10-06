import { DocumentType } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { useStore } from '@tdev-hooks/useStore';
import { useFirstMainDocument } from './useFirstMainDocument';
import { Config } from '@tdev-api/documentRoot';
import React from 'react';
import { authClient } from '@tdev/auth-client';

export const DUMMY_DOCUMENT_ID = 'dummy' as const;
const WAIT_FOR_LOGIN = 300;

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
    access: Partial<Config> = {}
) => {
    const [t0] = React.useState(Date.now());
    const { data: session } = authClient.useSession();
    const mainDoc = useFirstMainDocument(documentRootId, meta, createDocument, access);
    const [loginDelayElapsed, setLoginDelayElapsed] = React.useState(false);
    React.useEffect(() => {
        if (loginDelayElapsed) {
            return;
        }
        const tId = setTimeout(() => {
            setLoginDelayElapsed(true);
        }, WAIT_FOR_LOGIN);
        return () => clearTimeout(tId);
    }, []);

    const hasId = !!documentRootId;
    if (hasId) {
        if (!session?.user) {
            if (mainDoc.authorId === DUMMY_DOCUMENT_ID || !mainDoc.root || mainDoc.root.isDummy) {
                return;
            }
        } else if (!loginDelayElapsed) {
            return;
        }
    }
    return mainDoc;
};
