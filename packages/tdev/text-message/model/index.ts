import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { Document as DocumentProps, Factory, TypeDataMapping } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { ModelMeta } from './ModelMeta';

export const createModel: Factory = (data, store) => {
    return new TextMessage(data as DocumentProps<'text_message'>, store);
};

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
