import iCodeMeta from '@tdev-models/documents/iCode/iCodeMeta';
export interface MetaInit {
    code: string;
    readonly: boolean;
}

export class ModelMeta extends iCodeMeta<'pyodide_script'> {
    constructor(props: Partial<MetaInit>) {
        super(props, 'pyodide_script');
    }
}
