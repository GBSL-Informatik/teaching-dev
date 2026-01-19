import { siteModules } from '@tdev/pyodide-code/pyodideJsModules/siteModules';

export interface MessageTypeMap {}

export type MessageType = keyof MessageTypeMap;

export type Message = MessageTypeMap[MessageType];

export interface Context {
    sendMessage: (message: Message) => void;
    getTime: () => number;
}

export type ModuleType = { [key in MessageType]: (ctx: Context) => object };
export const pyodideJsModules: Partial<ModuleType> = {
    ...siteModules
};
