import type QuillDocument from '@tdev-models/documents/QuillV2';
import { action, reaction } from 'mobx';
import type Quill from 'quill';
import type { Delta } from 'quill/core';
import React from 'react';
import type ImageResize from '../quill-img-resize';

/** Link editor changes and save shortcuts to the model, and apply external model updates. */
export const useQuillDocumentSync = (doc: QuillDocument, quill: Quill | undefined): void => {
    React.useEffect(() => {
        if (!quill) {
            return;
        }

        let localDelta: Delta | undefined;
        const handleTextChange = action((change: Delta) => {
            const dataAttrsOnly = change.ops.every(
                (op) =>
                    op.retain !== undefined &&
                    (!op.attributes || Object.keys(op.attributes).every((key) => key.startsWith('data-')))
            );
            if (dataAttrsOnly) {
                return;
            }
            localDelta = quill.getContents();
            doc.setDelta(localDelta);
        });
        const handleSave = action(() => {
            doc.saveNow();
        });
        const disposeSync = reaction(
            () => doc.delta,
            (delta) => {
                // Keep local edits in place to preserve selection and undo history.
                if (delta !== localDelta) {
                    (quill.getModule('imageResize') as ImageResize | undefined)?.hide();
                    quill.setContents(delta, 'silent');
                }
                localDelta = undefined;
            },
            { fireImmediately: true }
        );
        quill.history.clear();

        quill.on('text-change', handleTextChange);
        quill.keyboard.addBinding({ key: 's', shortKey: true, handler: handleSave });

        return () => {
            disposeSync();
            quill.off('text-change', handleTextChange);
            // Quill exposes its bindings but has no removeBinding API.
            quill.keyboard.bindings.s = quill.keyboard.bindings.s.filter(
                (binding) => binding.handler !== handleSave
            );
        };
    }, [doc, quill]);
};
