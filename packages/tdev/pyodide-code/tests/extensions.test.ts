import type { LoadContext } from '@docusaurus/types';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRegistrySource, resolveExtensions, type ExtensionConfig } from '../extensions/config';
import pyodidePlugin from '../plugin';

const siteDir = path.resolve(import.meta.dirname, 'fixtures');
const clock: ExtensionConfig = {
    name: 'clock',
    worker: './worker.ts',
    client: './client.ts'
};
const temporaryDirectories: string[] = [];

const createExtensionFolder = (descriptor: unknown = clock) => {
    const temporarySite = mkdtempSync(path.join(os.tmpdir(), 'pyodide-extension-'));
    temporaryDirectories.push(temporarySite);
    const directory = path.join(temporarySite, 'website', 'copied-extension');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'extension.json'), JSON.stringify(descriptor));
    writeFileSync(path.join(directory, 'worker.ts'), "throw new Error('Must not load worker in Node');");
    writeFileSync(
        path.join(directory, 'client.ts'),
        "throw new Error('Must not load browser code in Node');"
    );
    return { temporarySite, directory };
};

afterEach(() => {
    for (const directory of temporaryDirectories) {
        rmSync(directory, { recursive: true, force: true });
    }
    temporaryDirectories.length = 0;
});

describe('Pyodide extension configuration', () => {
    it('resolves explicit entries relative to the site directory', () => {
        expect(resolveExtensions(siteDir, { extensions: [clock] })).toEqual([
            {
                name: 'clock',
                worker: path.resolve(siteDir, clock.worker),
                client: path.resolve(siteDir, clock.client)
            }
        ]);
    });

    it('resolves descriptor entries relative to a copied folder without loading browser or worker code', () => {
        const { temporarySite, directory } = createExtensionFolder();

        expect(resolveExtensions(temporarySite, { extensions: ['./website/copied-extension'] })).toEqual([
            {
                name: 'clock',
                worker: path.join(directory, 'worker.ts'),
                client: path.join(directory, 'client.ts')
            }
        ]);
    });

    it('keeps an extension portable when its folder is copied to a different location', () => {
        const { temporarySite, directory } = createExtensionFolder();
        const copiedDirectory = path.join(temporarySite, 'renamed-clock');
        cpSync(directory, copiedDirectory, { recursive: true });

        expect(resolveExtensions(temporarySite, { extensions: [copiedDirectory] })).toEqual([
            {
                name: 'clock',
                worker: path.join(copiedDirectory, 'worker.ts'),
                client: path.join(copiedDirectory, 'client.ts')
            }
        ]);
    });

    it('rejects duplicate names shared by descriptors and explicit entries', () => {
        const { directory } = createExtensionFolder();

        expect(() => resolveExtensions(siteDir, { extensions: [clock, directory] })).toThrow(
            'Duplicate Pyodide extension: clock'
        );
    });

    it('identifies a missing descriptor', () => {
        expect(() => resolveExtensions(siteDir, { extensions: ['./missing-extension'] })).toThrow(
            `Cannot read Pyodide extension descriptor: ${path.join(siteDir, 'missing-extension', 'extension.json')}`
        );
    });

    it('identifies invalid descriptor JSON', () => {
        const { temporarySite, directory } = createExtensionFolder();
        writeFileSync(path.join(directory, 'extension.json'), '{');

        expect(() => resolveExtensions(temporarySite, { extensions: [directory] })).toThrow(
            `Invalid JSON in Pyodide extension descriptor: ${path.join(directory, 'extension.json')}`
        );
    });

    it.each([null, [], { name: 'clock' }, { ...clock, worker: false }])(
        'identifies an invalid descriptor shape: %j',
        (descriptor) => {
            const { temporarySite, directory } = createExtensionFolder(descriptor);

            expect(() => resolveExtensions(temporarySite, { extensions: [directory] })).toThrow(
                `Invalid Pyodide extension descriptor: ${path.join(directory, 'extension.json')}`
            );
        }
    );

    it('identifies unresolved entries inside a descriptor', () => {
        const { temporarySite, directory } = createExtensionFolder({ ...clock, worker: './missing.ts' });

        expect(() => resolveExtensions(temporarySite, { extensions: [directory] })).toThrow(
            'Cannot resolve worker entry for Pyodide extension clock: ./missing.ts'
        );
    });

    it('supports an empty registry for websites without extensions', () => {
        expect(resolveExtensions(siteDir, {})).toEqual([]);
        expect(createRegistrySource([], 'worker')).toBe('export default [];');
    });

    it('rejects duplicate extension names', () => {
        expect(() => resolveExtensions(siteDir, { extensions: [clock, clock] })).toThrow(
            'Duplicate Pyodide extension: clock'
        );
    });

    it.each(['', 'clock/time', '1clock', undefined])('rejects invalid name %s', (name) => {
        const extension = { ...clock, name } as ExtensionConfig;
        expect(() => resolveExtensions(siteDir, { extensions: [extension] })).toThrow(
            'Each Pyodide extension needs a name'
        );
    });

    it.each(['worker', 'client'] as const)('identifies an unresolved %s entry', (side) => {
        const extension = { ...clock, [side]: './missing-pyodide-extension.ts' };
        expect(() => resolveExtensions(siteDir, { extensions: [extension] })).toThrow(
            `Cannot resolve ${side} entry for Pyodide extension clock`
        );
    });

    it('keeps worker and browser dependency graphs separate', () => {
        const [extension] = resolveExtensions(siteDir, { extensions: [clock] });
        const worker = createRegistrySource([extension], 'worker');
        const client = createRegistrySource([extension], 'client');
        expect(worker).toContain(JSON.stringify(extension.worker));
        expect(worker).not.toContain(extension.client);
        expect(client).toContain(JSON.stringify(extension.client));
        expect(client).not.toContain(extension.worker);
    });

    it('quotes paths and extension names in generated source', () => {
        const source = createRegistrySource(
            [{ name: 'clock', worker: '/a/"clock.js', client: '/b.js' }],
            'worker'
        );
        expect(source).toBe(
            'import extension0 from "/a/\\"clock.js";\n' +
                "if (typeof extension0?.createModules !== 'function') {\n" +
                '    throw new Error("Pyodide extension \\"clock\\": worker entry must default-export an object with createModules().");\n' +
                '}\n' +
                'export default [{ name: "clock", extension: extension0 }];'
        );
    });

    it.each(['worker', 'client'] as const)(
        'validates %s exports when the registry initializes',
        async (side) => {
            const entry = 'data:text/javascript,export default null;';
            const source = createRegistrySource([{ name: 'clock', worker: entry, client: entry }], side);
            const registryUrl = `data:text/javascript,${encodeURIComponent(source)}`;
            const methods = side === 'worker' ? 'createModules()' : 'createStore() and handleMessage()';

            await expect(import(/* @vite-ignore */ registryUrl)).rejects.toThrow(
                `Pyodide extension "clock": ${side} entry must default-export an object with ${methods}.`
            );
        }
    );

    it.each(['worker', 'client'] as const)(
        'loads a valid %s registry without invoking its entry',
        async (side) => {
            const methods = side === 'worker' ? ['createModules'] : ['createStore', 'handleMessage'];
            const entries = methods.map(
                (method) => `${method}() { throw new Error('Must not run during initialization'); }`
            );
            const entry = `data:text/javascript,${encodeURIComponent(
                `export default { ${entries.join(', ')} };`
            )}`;
            const source = createRegistrySource([{ name: 'clock', worker: entry, client: entry }], side);
            const registryUrl = `data:text/javascript,${encodeURIComponent(source)}`;

            const { default: registry } = await import(/* @vite-ignore */ registryUrl);

            expect(registry).toHaveLength(1);
            expect(registry[0].name).toBe('clock');
            for (const method of methods) {
                expect(typeof registry[0].extension[method]).toBe('function');
            }
        }
    );

    it('rejects a browser entry without its store factory', async () => {
        const entry = 'data:text/javascript,export default { handleMessage() {} };';
        const source = createRegistrySource([{ name: 'clock', worker: entry, client: entry }], 'client');
        const registryUrl = `data:text/javascript,${encodeURIComponent(source)}`;

        await expect(import(/* @vite-ignore */ registryUrl)).rejects.toThrow(
            'Pyodide extension "clock": client entry must default-export an object with createStore() and handleMessage().'
        );
    });

    it('makes generated registries available to SSR and preserves browser worker configuration', async () => {
        const plugin = pyodidePlugin({ siteDir } as LoadContext, { extensions: [clock] });
        const createData = vi.fn(async (name: string) => `/generated/${name}`);
        await plugin.contentLoaded?.({ content: undefined, actions: { createData } as never });

        const aliases = {
            '@tdev-pyodide/worker-extensions$': '/generated/worker-extensions.js',
            '@tdev-pyodide/client-extensions$': '/generated/client-extensions.js'
        };
        expect(plugin.configureWebpack?.({}, true, {} as never, undefined)).toEqual({
            resolve: { alias: aliases }
        });
        expect(plugin.configureWebpack?.({}, false, {} as never, undefined)).toMatchObject({
            resolve: { alias: aliases },
            module: {
                parser: {
                    javascript: {
                        worker: ['...', 'ModuleWorker from @tdev/pyodide-code/workers/ModuleWorker']
                    }
                }
            }
        });
        expect(createData).toHaveBeenCalledWith('worker-extensions.js', expect.stringContaining('worker.ts'));
        expect(createData).toHaveBeenCalledWith('client-extensions.js', expect.stringContaining('client.ts'));
    });
});
