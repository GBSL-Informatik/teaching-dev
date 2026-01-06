import Script from './models/Script';
import ScriptVersion from './models/ScriptVersion';

export interface ScriptData {
    code: string;
}

export interface ScriptVersionData {
    code: string;
    version: number;
    pasted?: boolean;
}

declare module '@tdev-api/document' {
    export interface TypeDataMapping {
        ['script']: ScriptData;
        ['script_version']: ScriptVersionData;
    }
    export interface TypeModelMapping {
        ['script']: Script;
        ['script_version']: ScriptVersion;
    }
}
