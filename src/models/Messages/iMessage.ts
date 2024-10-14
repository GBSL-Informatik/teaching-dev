import { UserMessageStore } from '@tdev-stores/UserMessageStore';
import { action, computed, observable } from 'mobx';

export enum MessageType {
    Text = 'text'
}

export interface TextData {
    text: string;
}

export interface TypeDataMapping {
    [MessageType.Text]: TextData;
}

abstract class iMessage<Type extends MessageType> {
    readonly store: UserMessageStore;
    readonly type: Type;
    readonly room: string;

    @observable.ref accessor data: TypeDataMapping[Type];
    @observable.ref accessor createdAt: Date;
    @observable.ref accessor deliveredAt: Date | undefined;
    @observable.ref accessor serverSentAt: Date | null = null;

    constructor(type: Type, room: string, data: TypeDataMapping[Type], store: UserMessageStore) {
        this.store = store;
        this.type = type;
        this.room = room;
        this.data = data;
        this.createdAt = new Date();
    }

    abstract prepareDelivery(): void;

    @action
    deliver() {
        this.prepareDelivery();
        this.deliveredAt = new Date();
        this.store.sendMessage(this);
    }

    @computed
    get canEdit() {
        return !this.deliveredAt && !this.serverSentAt;
    }

    get isDelivered() {
        return !this.deliveredAt;
    }

    get isServerSent() {
        return !this.serverSentAt;
    }

    get message() {
        return this.data;
    }
}

export default iMessage;
