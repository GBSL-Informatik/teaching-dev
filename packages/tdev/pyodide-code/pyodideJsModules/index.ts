import { siteModules } from './siteModules';

export interface MessageTypeMap {
    clock: {
        type: 'clock';
        id: string;
        clockType: 'hours' | 'minutes' | 'seconds';
        value: number;
        timeStamp: number;
    };
}

export type MessageType = keyof MessageTypeMap;

export type Message = MessageTypeMap[MessageType];

export interface Context {
    sendMessage: (message: Message) => void;
    getTime: () => number;
}

export type ModuleType = { [key in MessageType]: (ctx: Context) => object };
export const pyodideJsModules: ModuleType = {
    clock: (ctx: Context) => ({}),
    ...siteModules
};
