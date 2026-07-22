import iCodeMeta from '@tdev-models/documents/iCode/iCodeMeta';
export interface MetaInit {
    code: string;
    readonly: boolean;
}

export class ModelMeta extends iCodeMeta<'pyodide_code'> {
    constructor(props: Partial<MetaInit>) {
        super('pyodide_code', { lang: 'py', title: 'Python', ...props });
    }
}
