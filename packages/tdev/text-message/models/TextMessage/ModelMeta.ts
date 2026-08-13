import { TypeDataMapping } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';

export interface MetaInit {
    readonly?: boolean;
}

const DEFAULT_DATA = Object.freeze<TypeDataMapping['text_message']>({
    text: ''
});

export class ModelMeta extends TypeMeta<'text_message'> {
    readonly type = 'text_message';

    constructor(props: Partial<MetaInit>) {
        super('text_message', props);
    }

    get defaultData(): TypeDataMapping['text_message'] {
        return DEFAULT_DATA;
    }
}
