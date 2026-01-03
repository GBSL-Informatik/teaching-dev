import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { Access, Document as DocumentProps, Factory, TypeDataMapping } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { orderBy } from 'es-toolkit/array';
import TextMessage from '../TextMessage';
import { NoneAccess, RWAccess, sharedAccess } from '@tdev-models/helpers/accessPolicy';

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

    @computed
    get access() {
        const userId = this.store.root.userStore.current?.id;
        if (!userId || !this.root) {
            return Access.None_DocumentRoot;
        }
        if (this.store.root.userStore.isUserSwitched) {
            return Access.RO_DocumentRoot;
        }
        return sharedAccess(this.root.permission, this.root.sharedAccess, this.authorId === userId);
    }

    @computed
    get hasAdminAccess() {
        return this.store.root.userStore.current?.hasElevatedAccess || false;
    }

    @computed
    get canWriteMessages() {
        return RWAccess.has(this.access);
    }

    @computed
    get canReadMessages() {
        return !NoneAccess.has(this.access);
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
