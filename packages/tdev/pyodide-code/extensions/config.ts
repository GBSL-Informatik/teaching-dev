import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

export interface ExtensionConfig {
    name: string;
    worker: string;
    client: string;
}

export interface PluginOptions {
    extensions?: (ExtensionConfig | string)[];
}

export const resolveExtensions = (siteDir: string, options: PluginOptions): ExtensionConfig[] => {
    const extensions = options.extensions ?? [];
    if (!Array.isArray(extensions)) {
        throw new Error('Pyodide extensions must be an array.');
    }
    const names = new Set<string>();
    return extensions.map((configuration) => {
        const directory = typeof configuration === 'string' ? path.resolve(siteDir, configuration) : siteDir;
        const extension =
            typeof configuration === 'string' ? readExtensionDescriptor(directory) : configuration;
        if (!extension || typeof extension.name !== 'string' || !/^[a-zA-Z][\w-]*$/.test(extension.name)) {
            throw new Error('Each Pyodide extension needs a name starting with a letter.');
        }
        if (names.has(extension.name)) {
            throw new Error(`Duplicate Pyodide extension: ${extension.name}`);
        }
        names.add(extension.name);
        const resolve = createRequire(path.join(directory, 'package.json')).resolve;
        const resolveEntry = (entry: string, side: string) => {
            try {
                if (typeof entry !== 'string' || !entry) {
                    throw new Error('An entry must be a non-empty path.');
                }
                const entryPath = typeof configuration === 'string' ? path.resolve(directory, entry) : entry;
                return resolve(entryPath);
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
    const methods = side === 'worker' ? ['createModules'] : ['createStore', 'handleMessage'];
    const validations = extensions.map((extension, index) => {
        const requiredMethods = methods.map((method) => `${method}()`).join(' and ');
        const message = `Pyodide extension "${extension.name}": ${side} entry must default-export an object with ${requiredMethods}.`;
        const invalidMethods = methods
            .map((method) => `typeof extension${index}?.${method} !== 'function'`)
            .join(' || ');
        return [`if (${invalidMethods}) {`, `    throw new Error(${JSON.stringify(message)});`, '}'].join(
            '\n'
        );
    });
    const registrations = extensions.map(
        (extension, index) => `{ name: ${JSON.stringify(extension.name)}, extension: extension${index} }`
    );
    return [...imports, ...validations, `export default [${registrations.join(', ')}];`].join('\n');
};

const readExtensionDescriptor = (directory: string): ExtensionConfig => {
    const descriptorPath = path.join(directory, 'extension.json');
    let source: string;
    try {
        source = readFileSync(descriptorPath, 'utf8');
    } catch {
        throw new Error(`Cannot read Pyodide extension descriptor: ${descriptorPath}`);
    }
    let descriptor: unknown;
    try {
        descriptor = JSON.parse(source);
    } catch {
        throw new Error(`Invalid JSON in Pyodide extension descriptor: ${descriptorPath}`);
    }
    if (
        !descriptor ||
        typeof descriptor !== 'object' ||
        !('name' in descriptor) ||
        typeof descriptor.name !== 'string' ||
        !('worker' in descriptor) ||
        typeof descriptor.worker !== 'string' ||
        !('client' in descriptor) ||
        typeof descriptor.client !== 'string'
    ) {
        throw new Error(
            `Invalid Pyodide extension descriptor: ${descriptorPath}. Expected name, worker, and client string fields.`
        );
    }
    return { name: descriptor.name, worker: descriptor.worker, client: descriptor.client };
};
