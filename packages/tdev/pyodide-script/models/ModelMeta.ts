import { TypeDataMapping, Access } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';
export interface MetaInit {
    code: string;
    readonly: boolean;
}

export class ModelMeta extends TypeMeta<'pyodide_script'> {
    readonly type = 'pyodide_script';
    readonly initCode: string;

    constructor(props: Partial<MetaInit>) {
        super('pyodide_script', props.readonly ? Access.RO_User : undefined);
        this.initCode = props.code || '';
    }

    get defaultData(): TypeDataMapping['pyodide_script'] {
        return {
            code: this.initCode || ''
        };
    }
}
