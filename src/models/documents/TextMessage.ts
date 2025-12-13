import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { DocumentType, Document as DocumentProps, TypeDataMapping, Access } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';

export interface MetaInit {
    readonly?: boolean;
}

export class ModelMeta extends TypeMeta<'text_message'> {
    readonly type = 'text_message';

    constructor(props: Partial<MetaInit>) {
        super('text_message', props.readonly ? Access.RO_User : undefined);
    }

    get defaultData(): TypeDataMapping['text_message'] {
        return {
            text: ''
        };
    }
}

class TextMessage extends iDocument<'text_message'> {
    @observable accessor text: string;
    constructor(props: DocumentProps<'text_message'>, store: DocumentStore) {
        super(props, store);
        this.text = props.data.text;
    }

    @action
    setData(data: TypeDataMapping['text_message'], from: Source, updatedAt?: Date): void {
        this.text = data.text;
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping['text_message'] {
        return {
            text: this.text
        };
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === 'text_message') {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }

    @computed
    get isAuthor(): boolean {
        return this.authorId === this.store.root.userStore.viewedUserId;
    }

    @computed
    get sentToday(): boolean {
        return this.createdAt.toDateString() === new Date().toDateString();
    }
}

export default TextMessage;
