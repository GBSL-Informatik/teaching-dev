import { UserMessageStore } from '@tdev-stores/UserMessageStore';
import iMessage, { iProps, MessageType, TextData } from './iMessage';
import { action, observable } from 'mobx';

class TextMessage extends iMessage<MessageType.Text> {
    @observable accessor text: string = this.data.text;
    constructor(props: iProps<MessageType.Text>, store: UserMessageStore) {
        super(props, store);
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
