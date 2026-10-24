import type QuillDocument from '@tdev-models/documents/QuillV2';
import { reaction } from 'mobx';
import type Quill from 'quill';
import React from 'react';
import type ImageResize from '../quill-img-resize';

export const useQuillPermissions = (
    doc: QuillDocument,
    quill: Quill | undefined,
    readOnly?: boolean
): void => {
    React.useEffect(() => {
        if (!quill) {
            return;
        }
        return reaction(
            () => doc.canEdit,
            (canEdit) => {
                const enabled = canEdit && !readOnly;
                quill.enable(enabled);
                if (!enabled) {
                    (quill.getModule('imageResize') as ImageResize | undefined)?.hide();
                }
            },
            { fireImmediately: true }
        );
    }, [doc, quill, readOnly]);
};
