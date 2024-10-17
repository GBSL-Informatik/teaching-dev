import { action, computed, IObservableArray, observable } from 'mobx';
import { RootStore } from '@tdev-stores/rootStore';
import { iDeliveredMessage, IoClientEvent } from '@tdev-api/IoEventTypes';
import iMessage, { iProps, MessageType, TextData, TypeDataMapping } from '@tdev-models/Messages/iMessage';
import TextMessage from '@tdev-models/Messages/Text';

export class UserMessageStore {
    readonly root: RootStore;

    @observable accessor initialized = false;
    // messages = observable.array<iMessage<any>>([]);
    messages = observable.map<string, IObservableArray<iMessage<any>>>({}, { deep: false });

    constructor(store: RootStore) {
        this.root = store;
        this.initialized = true;
    }

    @action
    cleanup() {
        /**
         * clear all messages
         */
        this.messages.clear();
    }

    @action
    joinRoom(room: string) {
        if (this.root.socketStore.isLive) {
            this.root.socketStore.socket?.emit(IoClientEvent.USER_JOIN_ROOM, room, (roomId: string) => {
                this.messages.set(roomId, observable.array<iMessage<any>>([], { deep: false }));
            });
        }
    }

    @action
    leaveRoom(room: string) {
        if (this.root.socketStore.isLive) {
            this.root.socketStore.socket?.emit(IoClientEvent.USER_LEAVE_ROOM, room, () => {
                console.log('Left room:', room);
                this.messages.delete(room);
            });
        }
    }

    @action
    addMessageTo(room: string, message: iMessage<any>) {
        if (!this.messages.has(room)) {
            this.messages.set(room, observable.array<iMessage<any>>([], { deep: false }));
        }
        const conversation = this.messages.get(room);
        if (conversation) {
            conversation.push(message);
        }
    }

    @action
    sendMessage(message: iMessage<any>) {
        if (this.root.socketStore.isLive) {
            this.root.socketStore.socket?.emit(
                IoClientEvent.USER_MESSAGE,
                message.room,
                {
                    type: message.type,
                    data: message.data
                },
                action((serverSentAt) => {
                    message.serverSentAt = serverSentAt;
                    this.addMessageTo(message.room, message);
                })
            );
        }
    }

    @action
    handleMessage(to: string, message: iDeliveredMessage) {
        switch (message.type) {
            case MessageType.Text:
                this.addMessageTo(
                    to,
                    new TextMessage(
                        { ...(message as iDeliveredMessage<TypeDataMapping[MessageType.Text]>), room: to },
                        this
                    )
                );
                break;
            default:
                console.log('Message:', to, message);
        }
    }
}
