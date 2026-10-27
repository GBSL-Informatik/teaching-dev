import iCodeMeta from '@tdev-models/documents/iCode/iCodeMeta';
export interface MetaInit {
    code: string;
    readonly: boolean;
    packages: readonly string[];
}

export class ModelMeta extends iCodeMeta<'pyodide_code'> {
    readonly packages: readonly string[];

    constructor(props: Partial<MetaInit>) {
        super('pyodide_code', { lang: 'py', title: 'Python', ...props });
        this.packages = props.packages || [];
    }
}
