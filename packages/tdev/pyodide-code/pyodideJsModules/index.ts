import { siteModules } from '@tdev/pyodide-code/pyodideJsModules/siteModules';
import type { ExtensionMessage } from '../extensions';

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

export interface MessageTypeMap {
    log: LogMessage;
    error: ErrorMessage;
    clear: ClearMessage;
    extension: ExtensionMessage;
}

export type MessageType = keyof MessageTypeMap;

export type Message = MessageTypeMap[MessageType];

export interface Context {
    sendMessage: (message: Message) => void;
    getTime: () => number;
}

/** @deprecated Configure extensions in the pyodide-code plugin instead. */
export type ModuleType = Record<string, (ctx: Context) => object>;
export const pyodideJsModules: Partial<ModuleType> = {
    ...siteModules
};
