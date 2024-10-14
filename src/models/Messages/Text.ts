import { UserMessageStore } from '@tdev-stores/UserMessageStore';
import iMessage, { MessageType, TextData } from './iMessage';
import { action, observable } from 'mobx';

class TextMessage extends iMessage<MessageType.Text> {
    @observable accessor text: string = this.data.text;
    constructor(data: TextData, room: string, store: UserMessageStore) {
        super(MessageType.Text, room, data, store);
    }

    @action
    setText(text: string) {
        if (!this.canEdit) {
            return;
        }
        this.text = text;
    }

    @action
    prepareDelivery() {
        this.data = {
            text: this.text
        };
    }
}

export default TextMessage;
