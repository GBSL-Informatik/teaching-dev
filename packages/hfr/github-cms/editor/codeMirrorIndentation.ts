import { indentUnit } from '@codemirror/language';
import { EditorState } from '@codemirror/state';

/** indents with 4 spaces, as Python requires */
export const codeMirrorIndentation = [EditorState.tabSize.of(4), indentUnit.of('    ')];
