import { TypeDataMapping, Access, DocumentType, ScriptTypes } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { MetaProps } from '@tdev/theme/CodeBlock';
export interface MetaInit extends Omit<MetaProps, 'live_jsx' | 'live_py' | 'readonly' | 'title'> {
    code: string;
    lang: string;
    readonly?: boolean;
    title?: string;
    preCode?: string;
    postCode?: string;
    showLineNumbers?: boolean;
    className?: string;
    theme?: string;
}

class ScriptMeta<T extends ScriptTypes> extends TypeMeta<T> {
    readonly initCode: string;
    readonly title: string;
    readonly lang: string;
    readonly preCode: string;
    readonly postCode: string;
    readonly readonly: boolean;
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
    readonly versioned: boolean;

    constructor(props: Partial<MetaInit>, type: T) {
        super(type, props.readonly ? Access.RO_User : undefined);
        this.initCode = props.code || '';
        this.title = props.title || '';
        this.lang = props.lang || 'markdown';
        this.preCode = props.preCode || '';
        this.postCode = props.postCode || '';
        this.readonly = !!props.readonly;
        this.versioned = !!props.versioned;
        this.slim = !!props.slim;
        this.hasHistory = this.versioned && !this.slim && !props.noHistory;
        this.showLineNumbers = props.showLineNumbers !== undefined ? props.showLineNumbers : true;
        this.minLines = props.minLines;
        this.maxLines = props.maxLines || 25;
        this.isResettable = !(props.noReset || false);
        this.canCompare = !(props.noCompare || false);
        this.canDownload = !(props.noDownload || false);
        this.hideWarning = !!props.hideWarning;
        this.theme = props.theme;
    }

    get defaultData(): TypeDataMapping[T] {
        return {
            code: this.initCode
        } as TypeDataMapping[T];
    }
}

export default ScriptMeta;
