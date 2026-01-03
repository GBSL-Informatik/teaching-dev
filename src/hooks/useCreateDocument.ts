import React from 'react';
import { DocumentType } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import { useStore } from '@tdev-hooks/useStore';
import { Config } from '@tdev-api/documentRoot';
import { v4 as uuidv4 } from 'uuid';
import { action, runInAction } from 'mobx';

export const DUMMY_DOCUMENT_ID = 'dummy' as const;

/**
 * This hook provides access to the first main document of the rootDocument.
 * This is especially useful, when the DocumentType is expected to have only
 * one main document - like a TaskState.
 *
 * For bridging the time until the first main document is loaded,
 * a dummy document is provided in the meantime.
 */
export const useCreateDocument = <Type extends DocumentType>(
    documentRootId: string | undefined,
    meta: TypeMeta<Type>,
    uniqueMain: boolean = true,
    access: Partial<Config> = {}
) => {
    const [uuid] = React.useState(uuidv4());
    const documentRoot = useDocumentRoot(documentRootId, meta, false, access);
    const userStore = useStore('userStore');
    const userId = userStore.current?.id;
    const documentStore = useStore('documentStore');

    const create = React.useCallback(() => {
        console.log('useCreateDocument.create called', userId, documentRoot.id, meta.type);
        if (!userId) {
            return Promise.resolve(null);
        }
        return runInAction(() => {
            return documentStore.create(
                {
                    id: uuid, // this won't have any effect server-side, but allows to track the creation state
                    documentRootId: documentRoot.id,
                    authorId: userId,
                    type: meta.type,
                    data: meta.defaultData
                },
                uniqueMain
            );
        });
    }, [userId, uniqueMain, uuid]);

    return { create, apiState: documentStore.apiStateFor(`create-${uuid}`) };
};
