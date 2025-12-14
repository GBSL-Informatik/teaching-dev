import TextMessage from './model';

export interface TextMessageData {
    text: string;
}

declare module '@tdev-api/document' {
    export interface RoomTypeNames {
        ['text_message']: 'text_message';
    }
    export interface TypeDataMapping {
        ['text_message']: TextMessageData;
    }
    export interface TypeModelMapping {
        ['text_message']: TextMessage;
    }
}
