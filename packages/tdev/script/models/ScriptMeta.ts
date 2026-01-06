import { Access, TypeDataMapping } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { Props as CodeEditorProps } from '../components/CodeEditor';

export class ScriptMeta extends TypeMeta<'script'> {
    readonly type = 'script';
    readonly title: string;
    readonly lang: 'py' | string;
    readonly preCode: string;
    readonly postCode: string;
    readonly readonly: boolean;
    readonly versioned: boolean;
    readonly initCode: string;
    readonly slim: boolean;
    readonly hasHistory: boolean;
    readonly showLineNumbers: boolean;
    readonly minLines?: number;
    readonly maxLines: number;
    readonly isResettable: boolean;
    readonly canCompare: boolean;
    readonly canDownload: boolean;
    readonly hideWarning: boolean;
    readonly theme?: string;

    constructor(props: Partial<Omit<CodeEditorProps, 'id' | 'className'>>) {
        super('script', props.readonly ? Access.RO_User : undefined);
        this.title = props.title || '';
        this.lang = props.lang || 'py';
        this.preCode = props.preCode || '';
        this.postCode = props.postCode || '';
        this.readonly = !!props.readonly;
        this.versioned = !!props.versioned;
        this.initCode = props.code || '';
        this.slim = !!props.slim;
        this.hasHistory = !!props.versioned && !props.noHistory;
        this.showLineNumbers = props.showLineNumbers === undefined ? true : props.showLineNumbers;
        this.maxLines = props.maxLines || 25;
        this.minLines = props.minLines;
        this.isResettable = !props.noReset;
        this.canCompare = !props.noCompare;
        this.canDownload = !props.noDownload;
        this.hideWarning = !!props.hideWarning;
        this.theme = props.theme;
    }

    get defaultData(): TypeDataMapping['script'] {
        return {
            code: this.initCode
        };
    }
}
