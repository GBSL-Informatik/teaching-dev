import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import packageDocsSync from '../../../../updateSync/packageDocsSync';
import { getDebouncedSyncer } from '../../../../updateSync/packageDocsSync/actions';
import { createDocsSync, syncPyodideDocs, type PyodideDocsOptions } from '../docsSync';

const temporaryDirectories: string[] = [];

const docsExtension = (options: PyodideDocsOptions) => ({
    watchPaths: [],
    sync: (destination: string) => syncPyodideDocs(destination, options)
});

const createSite = async () => {
    const siteDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pyodide-docs-'));
    temporaryDirectories.push(siteDir);
    const websiteDir = path.join(siteDir, 'website');
    const packageDir = path.join(siteDir, 'packages');
    const destination = path.join(siteDir, 'generated');
    const coreDocs = path.join(packageDir, 'tdev/pyodide-code/docs');
    await fs.mkdir(coreDocs, { recursive: true });
    await fs.writeFile(path.join(coreDocs, 'README.mdx'), '# Pyodide\n');
    await fs.mkdir(path.join(destination, 'tdev/pyodide-code'), { recursive: true });
    return { siteDir, websiteDir, packageDir, destination };
};

const createExtension = async (websiteDir: string, name: string, root = 'pyodide', withShowcase = true) => {
    const directory = path.join(websiteDir, root, name);
    await fs.mkdir(path.join(directory, 'docs/images'), { recursive: true });
    await fs.mkdir(path.join(directory, 'assets'), { recursive: true });
    await fs.writeFile(
        path.join(directory, 'extension.json'),
        JSON.stringify({
            name,
            worker: './worker.ts',
            client: './client.ts',
            ...(withShowcase ? { showcase: './docs' } : {})
        })
    );
    // Documentation discovery must resolve paths without evaluating extension modules.
    const entry = "throw new Error('Extension code must not run during documentation sync');\n";
    await fs.writeFile(path.join(directory, 'worker.ts'), entry);
    await fs.writeFile(path.join(directory, 'client.ts'), entry);
    await fs.writeFile(path.join(directory, 'README.md'), `# ${name}\n\n![Asset](./assets/icon.svg)\n`);
    await fs.writeFile(path.join(directory, 'assets/icon.svg'), '<svg />');
    await fs.writeFile(path.join(directory, 'docs/index.mdx'), `# ${name} showcase\n`);
    await fs.writeFile(path.join(directory, 'docs/details.md'), '# Details\n');
    await fs.writeFile(path.join(directory, 'docs/images/demo.svg'), '<svg />');
    return directory;
};

afterEach(async () => {
    await Promise.all(
        temporaryDirectories.splice(0).map((directory) =>
            fs.rm(directory, {
                recursive: true,
                force: true
            })
        )
    );
});

describe('Pyodide extension documentation', () => {
    it('creates an adapter from the site configuration for copying and watching showcases', async () => {
        const site = await createSite();
        const clock = await createExtension(site.websiteDir, 'clock');
        const adapter = createDocsSync({
            websiteDir: site.websiteDir,
            plugins: [['@tdev/pyodide-code/plugin', { extensions: [clock] }]]
        });
        expect(adapter.watchPaths).toContain(clock);
        expect(adapter.watchPaths).toContain(path.join(site.websiteDir, 'packages/pyodide'));
        await packageDocsSync(site.packageDir, site.destination, adapter);
        expect(
            await fs.readFile(
                path.join(site.destination, 'tdev/pyodide-code/extensions/clock/index.mdx'),
                'utf8'
            )
        ).toContain('clock showcase');
    });

    it('builds an empty extension index when neither extension root exists', async () => {
        const site = await createSite();
        await packageDocsSync(site.packageDir, site.destination, docsExtension(site));
        const index = await fs.readFile(
            path.join(site.destination, 'tdev/pyodide-code/extensions/index.md'),
            'utf8'
        );
        expect(index).toContain('keine Erweiterungsdokumentationen');
        expect(index).not.toContain('Showcase]');
    });

    it('publishes passive READMEs from both roots without resolving inactive runtime entries', async () => {
        const site = await createSite();
        const clock = await createExtension(site.websiteDir, 'clock', 'pyodide', false);
        await createExtension(site.websiteDir, 'grid', 'packages/pyodide', false);
        await fs.rm(path.join(clock, 'worker.ts'));
        await fs.rm(path.join(clock, 'docs'), { recursive: true });

        await syncPyodideDocs(site.destination, site);
        const extensions = path.join(site.destination, 'tdev/pyodide-code/extensions');
        expect(await fs.readFile(path.join(extensions, 'clock/README.md'), 'utf8')).toContain('# clock');
        expect(await fs.readFile(path.join(extensions, 'grid/assets/icon.svg'), 'utf8')).toBe('<svg />');
        await expect(fs.access(path.join(extensions, 'clock/index.mdx'))).rejects.toThrow();
        await expect(fs.access(path.join(extensions, 'grid/index.mdx'))).rejects.toThrow();
        expect(await fs.readFile(path.join(extensions, 'index.md'), 'utf8')).toContain('./grid/README.md');
    });

    it('copies all showcase pages and assets only for registered extensions', async () => {
        const site = await createSite();
        const clock = await createExtension(site.websiteDir, 'clock');
        await createExtension(site.websiteDir, 'grid');
        await packageDocsSync(
            site.packageDir,
            site.destination,
            docsExtension({ ...site, extensions: [clock] })
        );

        const extensions = path.join(site.destination, 'tdev/pyodide-code/extensions');
        expect(await fs.readFile(path.join(extensions, 'clock/details.md'), 'utf8')).toBe('# Details\n');
        expect(await fs.readFile(path.join(extensions, 'clock/images/demo.svg'), 'utf8')).toBe('<svg />');
        expect(await fs.readFile(path.join(extensions, 'index.md'), 'utf8')).toContain('./clock/index.mdx');
        await expect(fs.access(path.join(extensions, 'grid/index.mdx'))).rejects.toThrow();
        await expect(fs.access(path.join(extensions, 'clock/showcase'))).rejects.toThrow();
    });

    it.each([false, true])(
        'skips the root README when showcase is configured (registered: %s)',
        async (registered) => {
            const site = await createSite();
            const clock = await createExtension(site.websiteDir, 'clock');
            await syncPyodideDocs(site.destination, { ...site, extensions: registered ? [clock] : [] });

            const extensions = path.join(site.destination, 'tdev/pyodide-code/extensions');
            await expect(fs.access(path.join(extensions, 'clock/README.md'))).rejects.toThrow();
            await expect(fs.access(path.join(extensions, 'clock/assets'))).rejects.toThrow();
            expect(await fs.readFile(path.join(extensions, 'index.md'), 'utf8')).not.toContain(
                './clock/README.md'
            );
            if (registered) {
                expect(await fs.readFile(path.join(extensions, 'clock/index.mdx'), 'utf8')).toContain(
                    'clock showcase'
                );
            } else {
                await expect(fs.access(path.join(extensions, 'clock/index.mdx'))).rejects.toThrow();
            }
        }
    );

    it('makes copied files read-only while preserving writable sources and stable generated index IDs', async () => {
        const site = await createSite();
        const clock = await createExtension(site.websiteDir, 'clock');
        const grid = await createExtension(site.websiteDir, 'grid', 'pyodide', false);
        const options = { ...site, extensions: [clock] };
        await syncPyodideDocs(site.destination, options);
        const extensions = path.join(site.destination, 'tdev/pyodide-code/extensions');
        for (const file of [
            'index.md',
            'grid/README.md',
            'grid/assets/icon.svg',
            'clock/index.mdx',
            'clock/details.md',
            'clock/images/demo.svg'
        ]) {
            expect((await fs.stat(path.join(extensions, file))).mode & 0o222).toBe(0);
        }
        expect((await fs.stat(path.join(clock, 'README.md'))).mode & 0o200).toBe(0o200);
        expect((await fs.stat(path.join(clock, 'docs/index.mdx'))).mode & 0o200).toBe(0o200);

        const index = await fs.readFile(path.join(extensions, 'index.md'), 'utf8');
        expect(index).toMatch(/^---\npage_id: [\da-f-]+\n---\n/);
        await fs.writeFile(path.join(grid, 'README.md'), '# Updated grid\n');
        await syncPyodideDocs(site.destination, options);
        expect(await fs.readFile(path.join(extensions, 'index.md'), 'utf8')).toBe(index);
        expect(await fs.readFile(path.join(extensions, 'grid/README.md'), 'utf8')).toBe('# Updated grid\n');
    });

    it('supports an extension without a showcase and an explicitly configured folder outside the roots', async () => {
        const site = await createSite();
        const clock = await createExtension(site.siteDir, 'clock', 'custom');
        await fs.writeFile(
            path.join(clock, 'extension.json'),
            JSON.stringify({
                name: 'clock',
                worker: './worker.ts',
                client: './client.ts'
            })
        );
        await syncPyodideDocs(site.destination, { ...site, extensions: ['./custom/clock'] });
        const extensions = path.join(site.destination, 'tdev/pyodide-code/extensions');
        expect(await fs.readFile(path.join(extensions, 'clock/README.md'), 'utf8')).toContain('# clock');
        await expect(fs.access(path.join(extensions, 'clock/index.mdx'))).rejects.toThrow();
    });

    it('publishes a showcase for a renamed inline registration and ignores incomplete inactive extensions', async () => {
        const site = await createSite();
        const clock = await createExtension(site.websiteDir, 'clock');
        const grid = await createExtension(site.websiteDir, 'grid');
        await fs.rm(path.join(grid, 'worker.ts'));
        await syncPyodideDocs(site.destination, {
            ...site,
            extensions: [
                {
                    name: 'wallclock',
                    worker: path.join(clock, 'worker.ts'),
                    client: path.join(clock, 'client.ts')
                }
            ]
        });
        const extensions = path.join(site.destination, 'tdev/pyodide-code/extensions');
        expect(await fs.readFile(path.join(extensions, 'clock/index.mdx'), 'utf8')).toContain(
            'clock showcase'
        );
        await expect(fs.access(path.join(extensions, 'grid/index.mdx'))).rejects.toThrow();
    });

    it('requires a showcase landing page instead of linking to an excluded partial', async () => {
        const site = await createSite();
        const clock = await createExtension(site.websiteDir, 'clock');
        await fs.rename(path.join(clock, 'docs/index.mdx'), path.join(clock, 'docs/_partial.mdx'));
        await expect(syncPyodideDocs(site.destination, { ...site, extensions: [clock] })).rejects.toThrow(
            'needs an index.md(x) or README.md(x) page'
        );
    });

    it('removes stale showcases and deleted extension documentation on subsequent synchronizations', async () => {
        const site = await createSite();
        const clock = await createExtension(site.websiteDir, 'clock');
        await syncPyodideDocs(site.destination, { ...site, extensions: [clock] });
        await syncPyodideDocs(site.destination, site);
        const extensions = path.join(site.destination, 'tdev/pyodide-code/extensions');
        await expect(fs.access(path.join(extensions, 'clock/index.mdx'))).rejects.toThrow();
        await expect(fs.access(path.join(extensions, 'clock/README.md'))).rejects.toThrow();

        await fs.rm(clock, { recursive: true });
        await syncPyodideDocs(site.destination, site);
        await expect(fs.access(path.join(extensions, 'clock'))).rejects.toThrow();
    });

    it.each(['../outside', '/tmp', './missing', './README.md', '.'])(
        'rejects a selected showcase outside an extension directory or without a directory: %s',
        async (showcase) => {
            const site = await createSite();
            const clock = await createExtension(site.websiteDir, 'clock');
            await fs.writeFile(
                path.join(clock, 'extension.json'),
                JSON.stringify({
                    name: 'clock',
                    worker: './worker.ts',
                    client: './client.ts',
                    showcase
                })
            );
            await expect(syncPyodideDocs(site.destination, { ...site, extensions: [clock] })).rejects.toThrow(
                'Invalid showcase for Pyodide extension clock'
            );
        }
    );

    it('rejects duplicate documentation names across the two roots', async () => {
        const site = await createSite();
        await createExtension(site.websiteDir, 'clock');
        await createExtension(site.websiteDir, 'clock', 'packages/pyodide');
        await expect(syncPyodideDocs(site.destination, site)).rejects.toThrow(
            'Duplicate Pyodide extension documentation: clock'
        );
    });

    it('restores extension pages after a watched package copy deletes the generated subtree', async () => {
        const site = await createSite();
        const clock = await createExtension(site.websiteDir, 'clock');
        const options = { ...site, extensions: [clock] };
        await packageDocsSync(site.packageDir, site.destination, docsExtension(options));
        const { syncQueue, syncDebounced } = await getDebouncedSyncer(site.packageDir, site.destination, () =>
            syncPyodideDocs(site.destination, options)
        );
        syncQueue.add({ packageDir: site.packageDir, org: 'tdev', package: 'pyodide-code' });
        syncDebounced();
        await syncDebounced.flush();
        const showcase = path.join(site.destination, 'tdev/pyodide-code/extensions/clock/index.mdx');
        expect(await fs.readFile(showcase, 'utf8')).toContain('clock showcase');
    });
});
