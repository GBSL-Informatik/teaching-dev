import { action, computed, observable } from 'mobx';
import { RootStore } from '@tdev-stores/rootStore';
import { iDeliveredMessage, IoClientEvent } from '@tdev-api/IoEventTypes';
import iMessage from '@tdev-models/Messages/iMessage';

export class UserMessageStore {
    readonly root: RootStore;

    @observable accessor initialized = false;
    constructor(store: RootStore) {
        this.root = store;
        this.initialized = true;
    }

    @action
    cleanup() {
        /**
         * clear all messages
         */
    }

    @action
    joinRoom(room: string) {
        if (this.root.socketStore.isLive) {
            this.root.socketStore.socket?.emit(IoClientEvent.USER_JOIN_ROOM, room, (roomId: string) => {
                console.log('Joined Room:', roomId);
            });
        }
    }

    @action
    leaveRoom(room: string) {
        if (this.root.socketStore.isLive) {
            this.root.socketStore.socket?.emit(IoClientEvent.USER_LEAVE_ROOM, room, () => {
                console.log('Left room:', room);
            });
        }
    }

    @action
    sendMessage(message: iMessage<any>) {
        console.log('Send message:', message.room, message.data);
        if (this.root.socketStore.isLive) {
            this.root.socketStore.socket?.emit(
                IoClientEvent.USER_MESSAGE,
                message.room,
                message,
                action((serverSentAt) => {
                    console.log('Message sent to:', message.room, serverSentAt);
                    message.serverSentAt = serverSentAt;
                })
            );
        }
    }

    @action
    handleMessage(to: string, message: iDeliveredMessage) {
        console.log('Message:', to, message);
    }
}
