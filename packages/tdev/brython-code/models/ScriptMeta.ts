import { Props as CodeEditorProps } from '@tdev-components/documents/CodeEditor';
import { default as iScriptMeta } from '@tdev-models/documents/iCode/iCodeMeta';

export interface LogMessage {
    type: 'done' | 'stdout' | 'stderr' | 'start';
    output: string;
    timeStamp: number;
}
export class ScriptMeta extends iScriptMeta<'script'> {
    constructor(props: Partial<Omit<CodeEditorProps, 'id' | 'className'>>) {
        super('script', { lang: 'py', title: 'Python', ...props });
    }
}
