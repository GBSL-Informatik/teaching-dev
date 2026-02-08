import { TypeDataMapping, Access } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';

export interface MetaInit {
    readonly?: boolean;
    minReadTime?: number;
}

export class ModelMeta extends TypeMeta<'page_read_check'> {
    readonly type = 'page_read_check';
    readonly minReadTime: number;

    constructor(props: Partial<MetaInit>) {
        super('page_read_check', props.readonly ? Access.RO_User : undefined);
        this.minReadTime = props.minReadTime || 10;
    }

    get defaultData(): TypeDataMapping['page_read_check'] {
        return {
            readTime: 0,
            read: false
        };
    }
}
