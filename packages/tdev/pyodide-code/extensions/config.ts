import { createRequire } from 'node:module';
import path from 'node:path';

export interface ExtensionConfig {
    name: string;
    worker: string;
    client: string;
}

export interface PluginOptions {
    extensions?: ExtensionConfig[];
}

export const resolveExtensions = (siteDir: string, options: PluginOptions): ExtensionConfig[] => {
    const extensions = options.extensions ?? [];
    if (!Array.isArray(extensions)) {
        throw new Error('Pyodide extensions must be an array.');
    }
    const names = new Set<string>();
    const resolve = createRequire(path.join(siteDir, 'package.json')).resolve;
    return extensions.map((extension) => {
        if (!extension || typeof extension.name !== 'string' || !/^[a-zA-Z][\w-]*$/.test(extension.name)) {
            throw new Error('Each Pyodide extension needs a name starting with a letter.');
        }
        if (names.has(extension.name)) {
            throw new Error(`Duplicate Pyodide extension: ${extension.name}`);
        }
        names.add(extension.name);
        const resolveEntry = (entry: string, side: string) => {
            try {
                return resolve(entry);
            } catch {
                throw new Error(
                    `Cannot resolve ${side} entry for Pyodide extension ${extension.name}: ${entry}`
                );
            }
        };
        return {
            name: extension.name,
            worker: resolveEntry(extension.worker, 'worker'),
            client: resolveEntry(extension.client, 'client')
        };
    });
};

export const createRegistrySource = (extensions: ExtensionConfig[], side: 'worker' | 'client'): string => {
    const imports = extensions.map(
        (extension, index) => `import extension${index} from ${JSON.stringify(extension[side])};`
    );
    const method = side === 'worker' ? 'createModules' : 'handleMessage';
    const validations = extensions.map((extension, index) => {
        const message = `Pyodide extension "${extension.name}": ${side} entry must default-export an object with ${method}().`;
        return [
            `if (typeof extension${index}?.${method} !== 'function') {`,
            `    throw new Error(${JSON.stringify(message)});`,
            '}'
        ].join('\n');
    });
    const registrations = extensions.map(
        (extension, index) => `{ name: ${JSON.stringify(extension.name)}, extension: extension${index} }`
    );
    return [...imports, ...validations, `export default [${registrations.join(', ')}];`].join('\n');
};
