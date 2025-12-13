import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import {
    DocumentType,
    Document as DocumentProps,
    TaskStateData,
    StateType,
    TypeDataMapping,
    Access
} from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';

export interface MetaInit {
    readonly?: boolean;
}

// TODO: replace all 'task_state' values to your new models Type
export class ModelMeta extends TypeMeta<'task_state'> {
    readonly type = 'task_state';

    constructor(props: Partial<MetaInit>) {
        super('task_state', props.readonly ? Access.RO_User : undefined);
    }

    get defaultData(): TypeDataMapping['task_state'] {
        throw 'Not Implemented';
    }
}

class Model extends iDocument<'task_state'> {
    constructor(props: DocumentProps<'task_state'>, store: DocumentStore) {
        super(props, store);
    }

    @action
    setData(data: TypeDataMapping['task_state'], from: Source, updatedAt?: Date): void {
        // TODO: change state according to data
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping['task_state'] {
        // TODO: return correct data
        return {} as any;
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === 'task_state') {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }
}

export default Model;
