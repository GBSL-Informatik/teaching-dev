import { action, computed } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { DocumentType, Document as DocumentProps, TypeDataMapping, Access } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';

export interface MetaInit {
    readonly?: boolean;
}

// TODO: replace all 'solution' values to your new models Type
export class ModelMeta extends TypeMeta<'solution'> {
    readonly type = 'solution';

    constructor(props: Partial<MetaInit>) {
        super('solution', props.readonly ? Access.RO_User : undefined);
    }

    get defaultData(): TypeDataMapping['solution'] {
        return {};
    }
}

class Solution extends iDocument<'solution'> {
    constructor(props: DocumentProps<'solution'>, store: DocumentStore) {
        super(props, store);
    }

    @action
    setData(data: TypeDataMapping['solution'], from: Source, updatedAt?: Date): void {
        // TODO: change state according to data
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping['solution'] {
        return {};
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === 'solution') {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }
}

export default Solution;
