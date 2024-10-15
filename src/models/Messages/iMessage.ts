import { iDeliveredMessage, iMessage as ClientMessageProps } from '@tdev-api/IoEventTypes';
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

export interface iProps<Type extends MessageType> {
    type: Type;
    data: TypeDataMapping[Type];
    room: string;
    senderId?: string;
}

abstract class iMessage<Type extends MessageType> {
    readonly store: UserMessageStore;
    readonly type: Type;
    readonly room: string;

    @observable.ref accessor data: TypeDataMapping[Type];
    @observable.ref accessor createdAt: Date;
    @observable.ref accessor deliveredAt: Date | undefined;
    @observable.ref accessor serverSentAt: Date | null = null;
    @observable.ref accessor senderId: string | undefined;

    constructor(props: iProps<Type>, store: UserMessageStore) {
        this.store = store;
        this.type = props.type;
        this.room = props.room;
        this.data = props.data;
        this.senderId = props.senderId;
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

    @computed
    get author() {
        return this.store.root.userStore.find(this.senderId);
    }
}

export default iMessage;
