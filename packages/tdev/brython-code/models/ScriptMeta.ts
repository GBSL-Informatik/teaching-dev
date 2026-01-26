import { Document as DocumentProps, Factory } from '@tdev-api/document';
import { Props as CodeEditorProps } from '@tdev-components/documents/CodeEditor';
import _ from 'es-toolkit/compat';
import { default as iScriptMeta } from '@tdev-models/documents/iCode/iCodeMeta';
import Script from './Script';

export interface LogMessage {
    type: 'done' | 'stdout' | 'stderr' | 'start';
    output: string;
    timeStamp: number;
}
export const createModel: Factory = (data, store) => {
    return new Script(data as DocumentProps<'script'>, store);
};

export class ScriptMeta extends iScriptMeta<'script'> {
    constructor(props: Partial<Omit<CodeEditorProps, 'id' | 'className'>>) {
        super(props, 'script');
    }
}
