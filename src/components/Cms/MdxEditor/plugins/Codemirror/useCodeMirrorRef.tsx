// https://github.com/mdx-editor/editor/blob/main/src/plugins/sandpack/useCodeMirrorRef.ts
import type { EditorView } from '@codemirror/view';
import React from 'react';
import { usePublisher } from '@mdxeditor/gurx';
import { editorInFocus$, useCodeBlockEditorContext, VoidEmitter } from '@mdxeditor/editor';
import { $insertPlaceholderParagraph } from '../focusHandler/keyDownHandler';

interface CodeMirrorRef {
    getCodemirror: () => EditorView | undefined;
}

export function useCodeMirrorRef(
    editorType: 'codeblock' | 'sandpack',
    language: string,
    focusEmitter: VoidEmitter
) {
    const setEditorInFocus = usePublisher(editorInFocus$);
    const codeMirrorRef = React.useRef<CodeMirrorRef | null>(null);
    const { lexicalNode, parentEditor } = useCodeBlockEditorContext();

    const onFocusHandler = React.useCallback(() => {
        setEditorInFocus({
            editorType,
            rootNode: lexicalNode
        });
    }, [editorType, lexicalNode, setEditorInFocus]);

    const onKeyDownHandler = React.useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                const state = codeMirrorRef.current?.getCodemirror()?.state;
                if (state) {
                    const docLength = state.doc.length;
                    const selectionEnd = state.selection.ranges[0].to;

                    if (docLength === selectionEnd) {
                        parentEditor?.update(() => {
                            const latest = lexicalNode.getLatest();
                            if (!latest) {
                                return;
                            }
                            const nextSibling = latest.getNextSibling();
                            if (nextSibling) {
                                latest.selectNext();
                            } else {
                                $insertPlaceholderParagraph((p) => latest.insertAfter(p));
                            }
                            codeMirrorRef.current?.getCodemirror()?.contentDOM.blur();
                        });
                    }
                }
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                const state = codeMirrorRef.current?.getCodemirror()?.state;
                if (state) {
                    const selectionStart = state.selection.ranges[0].from;

                    if (selectionStart === 0) {
                        parentEditor?.update(() => {
                            const latest = lexicalNode.getLatest();
                            if (!latest) {
                                return;
                            }
                            const prevSibling = latest.getPreviousSibling();
                            if (prevSibling) {
                                latest.selectPrevious();
                            } else {
                                $insertPlaceholderParagraph((p) => latest.insertBefore(p));
                            }
                            codeMirrorRef.current?.getCodemirror()?.contentDOM.blur();
                        });
                    }
                }
            } else if (e.key === 'Enter') {
                e.stopPropagation();
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                const state = codeMirrorRef.current?.getCodemirror()?.state;
                const docLength = state?.doc.length;
                if (docLength === 0) {
                    parentEditor.update(() => {
                        const latest = lexicalNode.getLatest();
                        latest?.remove();
                    });
                }
            }
        },
        [parentEditor, lexicalNode.getKey()]
    );

    React.useEffect(() => {
        const codeMirror = codeMirrorRef.current;
        setTimeout(() => {
            codeMirror?.getCodemirror()?.contentDOM.addEventListener('focus', onFocusHandler);
            codeMirror?.getCodemirror()?.contentDOM.addEventListener('keydown', onKeyDownHandler);
        }, 300);

        return () => {
            codeMirror?.getCodemirror()?.contentDOM.removeEventListener('focus', onFocusHandler);
            codeMirror?.getCodemirror()?.contentDOM.removeEventListener('keydown', onKeyDownHandler);
        };
    }, [codeMirrorRef, onFocusHandler, onKeyDownHandler, language]);

    React.useEffect(() => {
        focusEmitter.subscribe(() => {
            codeMirrorRef.current?.getCodemirror()?.focus();
            onFocusHandler();
        });
    }, [focusEmitter, codeMirrorRef, lexicalNode.getKey(), onFocusHandler]);

    return codeMirrorRef;
}
