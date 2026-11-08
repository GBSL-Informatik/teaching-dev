import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { MergeView, unifiedMergeView } from '@codemirror/merge';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type File from '../../../models/File';
import { loadLanguage } from '../../codeMirrorLanguage';

interface DiffView {
    destroy: () => void;
}

const COLLAPSE_UNCHANGED = { margin: 2 };

const PHRASES = EditorState.phrases.of({
    '$ unchanged lines': '$ unveränderte Zeilen',
    'Revert this chunk': 'Änderung rückgängig machen'
});

/** the diff is read-only, changes can only be reverted */
const readOnlyExtensions = (language: Compartment, isDark: boolean): Extension[] => [
    EditorState.readOnly.of(true),
    EditorView.darkTheme.of(isDark),
    EditorView.lineWrapping,
    syntaxHighlighting(defaultHighlightStyle),
    PHRASES,
    language.of([])
];

/** reverted changes are written to the file */
const writeToFile = (file: File) =>
    EditorView.updateListener.of((update) => {
        if (update.docChanged) {
            file.setContent(update.state.doc.toString());
        }
    });

const applyLanguage = async (file: File, language: Compartment, editors: EditorView[]) => {
    const support = await loadLanguage(file);
    editors
        .filter((editor) => editor.dom.isConnected)
        .forEach((editor) => editor.dispatch({ effects: language.reconfigure(support) }));
};

/**
 * The saved version next to the edited version, with a button to revert each change.
 */
export const createSplitDiff = (parent: HTMLElement, file: File, isDark: boolean): DiffView => {
    const language = new Compartment();
    const view = new MergeView({
        parent,
        a: { doc: file._pristine, extensions: readOnlyExtensions(language, isDark) },
        b: { doc: file.content, extensions: [...readOnlyExtensions(language, isDark), writeToFile(file)] },
        revertControls: 'a-to-b',
        collapseUnchanged: COLLAPSE_UNCHANGED
    });
    applyLanguage(file, language, [view.a, view.b]);
    return view;
};

/** accepting a change has no meaning here: the edited version is kept anyway */
const revertButtonOnly = (type: 'accept' | 'reject', action: (event: MouseEvent) => void) => {
    if (type === 'accept') {
        return document.createElement('span');
    }
    const button = document.createElement('button');
    button.name = 'reject';
    button.textContent = 'Rückgängig';
    button.onmousedown = action;
    return button;
};

/**
 * The edited version with the removed lines in between, with a button to revert each change.
 */
export const createUnifiedDiff = (parent: HTMLElement, file: File, isDark: boolean): DiffView => {
    const language = new Compartment();
    const view = new EditorView({
        parent,
        doc: file.content,
        extensions: [
            ...readOnlyExtensions(language, isDark),
            unifiedMergeView({
                original: file._pristine,
                mergeControls: revertButtonOnly,
                collapseUnchanged: COLLAPSE_UNCHANGED
            }),
            writeToFile(file)
        ]
    });
    applyLanguage(file, language, [view]);
    return view;
};
