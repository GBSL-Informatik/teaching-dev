import { TypeDataMapping, Access } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';

export interface MetaInit {
    readonly?: boolean;
    name?: string;
}

export class ModelMeta extends TypeMeta<'simple_chat'> {
    readonly type = 'simple_chat';
    readonly defaultName: string;

    constructor(props: Partial<MetaInit>) {
        super('simple_chat', props.readonly ? Access.RO_User : undefined);
        this.defaultName = props.name || 'Simple Chat';
    }

    get defaultData(): TypeDataMapping['simple_chat'] {
        return {
            name: this.defaultName
        };
    }
}
