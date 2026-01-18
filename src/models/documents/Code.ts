import { Document as DocumentProps } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { default as iScriptMeta } from './iCode/iCodeMeta';
import { Props as CodeEditorProps } from '@tdev-components/documents/CodeEditor';
import iCode from './iCode';

export class CodeMeta extends iScriptMeta<'code'> {
    constructor(props: Partial<Omit<CodeEditorProps, 'id' | 'className'>>) {
        super(props, 'code');
    }
}

export default class Code extends iCode<'code'> {
    constructor(props: DocumentProps<'code'>, store: DocumentStore) {
        super(props, store);
    }
}
