import ScriptMeta from '@tdev-models/documents/iScript/ScriptMeta';
export interface MetaInit {
    code: string;
    readonly: boolean;
}

export class ModelMeta extends ScriptMeta<'pyodide_script'> {
    constructor(props: Partial<MetaInit>) {
        super(props, 'pyodide_script');
    }
}
