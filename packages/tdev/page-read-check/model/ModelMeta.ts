import { TypeDataMapping, Access } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { fSeconds } from '../helpers/time';

export interface MetaInit {
    readonly?: boolean;
    minReadTime?: number;
}

const DEFAULT_DATA = Object.freeze<TypeDataMapping['page_read_check']>({
    readTime: 0,
    read: false
});

export class ModelMeta extends TypeMeta<'page_read_check'> {
    readonly type = 'page_read_check';
    readonly minReadTime: number;

    constructor(props: Partial<MetaInit>) {
        super('page_read_check', props);
        this.minReadTime = props.minReadTime || 10;
    }

    get defaultData(): TypeDataMapping['page_read_check'] {
        return DEFAULT_DATA;
    }

    get fMinReadTime() {
        return fSeconds(this.minReadTime);
    }
}
