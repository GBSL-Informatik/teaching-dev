import SimpleChat from './models/SimpleChat';
import TextMessage from './models/TextMessage';

export interface TextMessageData {
    text: string;
}

export interface SimpleChatData {
    name: string;
}

declare module '@tdev-api/document' {
    export interface RoomTypeNames {
        ['text_messages']: 'text_messages';
    }
    export interface TypeDataMapping {
        ['text_message']: TextMessageData;
        ['simple_chat']: SimpleChatData;
    }
    export interface TypeModelMapping {
        ['text_message']: TextMessage;
        ['simple_chat']: SimpleChat;
    }
}
