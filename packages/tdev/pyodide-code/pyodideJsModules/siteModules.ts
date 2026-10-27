import type { ModuleType } from '@tdev/pyodide-code/pyodideJsModules';

/**
 * @deprecated Configure worker/client entries through the pyodide-code plugin.
 * Existing website overrides remain supported during migration.
 */

// declare module '@tdev/pyodide-code/pyodideJsModules' {
//     export interface MessageTypeMap {
//         foo: {
//             timeStamp: number;
//         };
//     }
// }

export const siteModules: Partial<ModuleType> = {};
