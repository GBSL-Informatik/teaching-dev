import type { ExtensionMessage } from './extensions';

export interface LogMessage {
    id: string;
    timeStamp: number;
    type: 'log';
    message: string;
}
export interface ErrorMessage {
    id: string;
    timeStamp: number;
    type: 'error';
    message: string;
}

export interface ClearMessage {
    id: string;
    timeStamp: number;
    type: 'clear';
}

export type Message = LogMessage | ErrorMessage | ClearMessage | ExtensionMessage;

export interface Context {
    sendMessage: (message: Message) => void;
    getTime: () => number;
}
