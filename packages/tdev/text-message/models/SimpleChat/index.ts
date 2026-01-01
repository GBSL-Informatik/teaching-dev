import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { Document as DocumentProps, Factory, TypeDataMapping } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { orderBy } from 'es-toolkit/compat';
import TextMessage from '../TextMessage';

export const createModel: Factory = (data, store) => {
    return new SimpleChat(data as DocumentProps<'simple_chat'>, store);
};

class SimpleChat extends iDocument<'simple_chat'> {
    @observable accessor name: string;
    @observable accessor messageText: string = '';

    constructor(props: DocumentProps<'simple_chat'>, store: DocumentStore) {
        super(props, store);
        this.name = props.data.name;
    }

    @action
    setData(data: TypeDataMapping['simple_chat'], from: Source, updatedAt?: Date): void {
        this.name = data.name;
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    @action
    setMessageText(text: string) {
        this.messageText = text;
    }

    @action
    sendMessage() {
        if (this.messageText.trim().length === 0 || !this.root?.hasRWAccess) {
            return;
        }

        return this.store
            .create({
                documentRootId: this.documentRootId,
                type: 'text_message',
                data: {
                    text: this.messageText
                }
            })
            .then((msg) => {
                if (msg) {
                    this.setMessageText('');
                }
            })
            .catch((err) => {
                console.error('Error sending message:', err);
            });
    }

    /**
     * Returns all text messages of this chat ordered by creation date ascending.
     */
    @computed
    get messages() {
        if (!this.root?.hasReadAccess) {
            return [];
        }
        return orderBy(
            this.root?.allDocuments.filter((doc) => doc.type === 'text_message'),
            ['createdAt'],
            ['asc']
        ) as TextMessage[];
    }

    get data(): TypeDataMapping['simple_chat'] {
        return {
            name: this.name
        };
    }
}

export default SimpleChat;
