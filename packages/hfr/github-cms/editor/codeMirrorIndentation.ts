import { indentWithTab } from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';

/**
 * Indents with 4 spaces, as Python requires. Tab and Shift-Tab indent the code instead of moving the focus,
 * Escape followed by Tab still moves the focus.
 *
 * @see https://codemirror.net/examples/tab/
 */
export const codeMirrorIndentation = [
    EditorState.tabSize.of(4),
    indentUnit.of('    '),
    keymap.of([indentWithTab])
];
