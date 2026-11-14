import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Compartment } from '@codemirror/state';
import { drawSelection, EditorView, keymap, lineNumbers } from '@codemirror/view';
import type File from '../../models/File';
import { codeMirrorIndentation } from '../codeMirrorIndentation';
import { loadLanguage } from '../codeMirrorLanguage';
import { codeMirrorUuidMarker } from '../nodeViews/codeMirrorUuidMarker';

/**
 * A CodeMirror editor for the source of the file. Changes are written to the file.
 */
export const createSourceView = (parent: HTMLElement, file: File) => {
    const language = new Compartment();
    const view = new EditorView({
        parent,
        doc: file.content,
        extensions: [
            history(),
            keymap.of([...defaultKeymap, ...historyKeymap]),
            codeMirrorIndentation,
            lineNumbers(),
            drawSelection(),
            syntaxHighlighting(defaultHighlightStyle),
            EditorView.lineWrapping,
            codeMirrorUuidMarker,
            language.of([]),
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    file.setContent(update.state.doc.toString());
                }
            })
        ]
    });
    loadLanguage(file).then((support) => {
        const isDestroyed = !view.dom.isConnected;
        if (isDestroyed) {
            return;
        }
        view.dispatch({ effects: language.reconfigure(support) });
    });
    return view;
};
