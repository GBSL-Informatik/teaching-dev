import type { LoadContext } from '@docusaurus/types';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createRegistrySource, resolveExtensions, type ExtensionConfig } from '../extensions/config';
import pyodidePlugin from '../plugin';

const siteDir = path.resolve(import.meta.dirname, 'fixtures');
const clock: ExtensionConfig = {
    name: 'clock',
    worker: './worker.ts',
    client: './client.ts'
};

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
                'export default [{ name: "clock", extension: extension0 }];'
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
