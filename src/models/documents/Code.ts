import { Document as DocumentProps } from '@tdev-api/document';
import { Props as CodeEditorProps } from '@tdev-components/documents/CodeEditor';
import DocumentStore from '@tdev-stores/DocumentStore';
import iCode from './iCode';
import { default as iScriptMeta } from './iCode/iCodeMeta';

export class CodeMeta extends iScriptMeta<'code'> {
    constructor(props: Partial<Omit<CodeEditorProps, 'id' | 'className'>>) {
        super('code', props);
    }
}

export default class Code extends iCode<'code'> {
    constructor(props: DocumentProps<'code'>, store: DocumentStore) {
        super(props, store);
    }
}
