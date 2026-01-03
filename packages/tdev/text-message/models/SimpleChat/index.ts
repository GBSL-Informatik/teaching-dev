import { action, computed, observable } from 'mobx';
import { Source } from '@tdev-models/iDocument';
import iShareableDocument from '@tdev-models/iShareableDocument';
import { Access, Document as DocumentProps, Factory, TypeDataMapping } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { orderBy } from 'es-toolkit/array';
import TextMessage from '../TextMessage';
import { NoneAccess, RWAccess, sharedAccess } from '@tdev-models/helpers/accessPolicy';

export const createModel: Factory = (data, store) => {
    return new SimpleChat(data as DocumentProps<'simple_chat'>, store);
};

class SimpleChat extends iShareableDocument<'simple_chat'> {
    @observable accessor messageText: string = '';

    constructor(props: DocumentProps<'simple_chat'>, store: DocumentStore) {
        super(props, store);
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
                parentId: this.id,
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

    @action
    clearHistory() {
        if (!this.store.root.userStore.current?.hasElevatedAccess) {
            return;
        }
        return this.store.apiDelete(this);
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
            this.root?.allDocuments.filter(
                (doc) => doc.parentId === this.id && doc.type === 'text_message'
            ) as TextMessage[],
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
