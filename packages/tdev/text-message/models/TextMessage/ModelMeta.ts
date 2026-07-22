import { TypeDataMapping, Access } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';

export interface MetaInit {
    readonly?: boolean;
}

export class ModelMeta extends TypeMeta<'text_message'> {
    readonly type = 'text_message';
    readonly props: Partial<MetaInit>;

    constructor(props: Partial<MetaInit>) {
        super('text_message', props.readonly ? Access.RO_User : undefined);
        this.props = props;
    }

    get defaultData(): TypeDataMapping['text_message'] {
        return {
            text: ''
        };
    }
}
