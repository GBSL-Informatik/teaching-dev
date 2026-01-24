import type { ModuleType } from '@tdev/pyodide-code/pyodideJsModules';

/**
 * this file is to add custom pyodide js modules for the teaching-dev website
 * ensure to remove this file from the updateTdev.config.yaml to avoid overwriting
 */

// declare module '@tdev/pyodide-code/pyodideJsModules' {
//     export interface MessageTypeMap {
//         foo: {
//             timeStamp: number;
//         };
//     }
// }

export const siteModules: Partial<ModuleType> = {};
