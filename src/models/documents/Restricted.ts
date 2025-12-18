import { action, computed } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { DocumentType, Document as DocumentProps, TypeDataMapping, Access } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';

export interface MetaInit {
    readonly?: boolean;
}

export class ModelMeta extends TypeMeta<'restricted'> {
    readonly type = 'restricted';

    constructor(props: Partial<MetaInit>) {
        super('restricted', props.readonly ? Access.RO_User : undefined);
    }

    get defaultData(): TypeDataMapping['restricted'] {
        return {};
    }
}

class Restricted extends iDocument<'restricted'> {
    constructor(props: DocumentProps<'restricted'>, store: DocumentStore) {
        super(props, store);
    }

    @action
    setData(_: TypeDataMapping['restricted'], from: Source, updatedAt?: Date): void {
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping['restricted'] {
        return {};
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === 'restricted') {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }
}

export default Restricted;
