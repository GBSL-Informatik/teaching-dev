import TextMessage from './model';
import DynamicRoom from '@tdev-models/documents/DynamicRoom';

export interface TextMessageData {
    text: string;
}

declare module '@tdev-api/document' {
    export interface RoomTypeMapping {
        ['text_messages']: DynamicRoom<'text_messages'>;
    }
    export interface TypeDataMapping {
        ['text_message']: TextMessageData;
    }
    export interface TypeModelMapping {
        ['text_message']: TextMessage;
    }
}
