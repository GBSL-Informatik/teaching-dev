import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import packageDocsSync from '..';
import { withSiteConfig } from '../../../src/siteConfig/withSiteConfig';
import { loadPyodideDocsSync } from '../configuration';

vi.mock('../../../src/siteConfig/withSiteConfig', () => ({
    withSiteConfig: vi.fn(async () => ({}))
}));

const temporaryDirectories: string[] = [];
const execute = promisify(execFile);
const resolve = createRequire(import.meta.url).resolve;

const createSite = async () => {
    const siteDir = await fs.mkdtemp(path.join(os.tmpdir(), 'optional-pyodide-docs-'));
    temporaryDirectories.push(siteDir);
    const packageDir = path.join(siteDir, 'packages');
    const destination = path.join(siteDir, 'generated');
    const docs = path.join(packageDir, 'other/example/docs');
    await fs.mkdir(docs, { recursive: true });
    await fs.writeFile(path.join(docs, 'README.md'), '# Example\n');
    return { siteDir, packageDir, destination, docs };
};

const writeAdapter = async (packageDir: string, source: string) => {
    const directory = path.join(packageDir, 'tdev/pyodide-code/docsSync');
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, 'index.ts'), source);
};

beforeEach(() => vi.clearAllMocks());

afterEach(async () => {
    await Promise.all(
        temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true }))
    );
});

describe('Optional Pyodide documentation integration', () => {
    it('syncs other packages without loading site configuration when Pyodide is absent', async () => {
        const site = await createSite();
        const extension = await loadPyodideDocsSync(site.packageDir);
        expect(extension).toBeUndefined();
        expect(withSiteConfig).not.toHaveBeenCalled();

        await packageDocsSync(site.packageDir, site.destination, extension);
        expect(await fs.readFile(path.join(site.destination, 'other/example/README.md'), 'utf8')).toBe(
            '# Example\n'
        );
        await expect(fs.access(path.join(site.destination, 'tdev/pyodide-code'))).rejects.toThrow();
    });

    it('loads a present adapter and its watch paths', async () => {
        const site = await createSite();
        await writeAdapter(
            site.packageDir,
            `
export const createDocsSync = () => ({ watchPaths: ['example'], sync: async () => {} });
`
        );
        const extension = await loadPyodideDocsSync(site.packageDir);
        expect(extension?.watchPaths).toEqual(['example']);
        expect(withSiteConfig).toHaveBeenCalledOnce();
        await extension?.sync(site.destination);
    });

    it('reports a missing adapter in a present package', async () => {
        const site = await createSite();
        await fs.mkdir(path.join(site.packageDir, 'tdev/pyodide-code'), { recursive: true });
        await expect(loadPyodideDocsSync(site.packageDir)).rejects.toThrow();
    });

    it.each([
        "throw new Error('broken adapter');",
        "export const createDocsSync = () => { throw new Error('broken adapter'); };"
    ])('does not hide errors from an installed adapter: %s', async (source) => {
        const site = await createSite();
        await writeAdapter(site.packageDir, source);
        await expect(loadPyodideDocsSync(site.packageDir)).rejects.toThrow('broken adapter');
    });

    it('runs prebuild, watch updates, and typecheck in a copied CLI without Pyodide', async () => {
        const site = await createSite();
        await prepareCopiedCli(site.siteDir);
        const cliDir = path.join(site.siteDir, 'updateSync/packageDocsSync');
        const args = ['--src', site.packageDir, '--dest', site.destination];
        const options = { cwd: site.siteDir, env: { ...process.env, SITE_CONFIG_PATH: './siteConfig.ts' } };
        await execute(
            process.execPath,
            ['--import', resolve('tsx'), path.join(cliDir, 'preBuild.ts'), ...args],
            { ...options, timeout: 5000 }
        );
        expect(await fs.readFile(path.join(site.destination, 'other/example/README.md'), 'utf8')).toBe(
            '# Example\n'
        );
        const compiler = path.join(path.dirname(resolve('typescript/package.json')), 'bin/tsc');
        await execute(process.execPath, [compiler, '--project', site.siteDir], { ...options, timeout: 5000 });

        const logPath = path.join(site.siteDir, 'watch.log');
        const log = await fs.open(logPath, 'w');
        const watcher = spawn(
            process.execPath,
            ['--import', resolve('tsx'), path.join(cliDir, 'watch.ts'), ...args],
            { ...options, stdio: ['ignore', log.fd, log.fd] }
        );
        try {
            await vi.waitFor(
                async () => {
                    expect(await fs.readFile(logPath, 'utf8')).toContain('Watching for package');
                },
                { timeout: 3000 }
            );
            await fs.writeFile(path.join(site.docs, 'README.md'), '# Updated example\n');
            await vi.waitFor(
                async () => {
                    expect(
                        await fs.readFile(path.join(site.destination, 'other/example/README.md'), 'utf8')
                    ).toBe('# Updated example\n');
                },
                { timeout: 5000 }
            );
        } finally {
            if (watcher.exitCode === null && watcher.signalCode === null) {
                const stopped = once(watcher, 'exit');
                watcher.kill();
                await stopped;
            }
            await log.close();
        }
    }, 15000);
});

const prepareCopiedCli = async (siteDir: string) => {
    await fs.cp(path.resolve(import.meta.dirname, '..'), path.join(siteDir, 'updateSync/packageDocsSync'), {
        recursive: true,
        filter: (source) => path.basename(source) !== 'tests'
    });
    await fs.mkdir(path.join(siteDir, 'src/siteConfig'), { recursive: true });
    await fs.copyFile(
        path.resolve(import.meta.dirname, '../../../src/siteConfig/withSiteConfig.ts'),
        path.join(siteDir, 'src/siteConfig/withSiteConfig.ts')
    );
    await fs.writeFile(
        path.join(siteDir, 'src/siteConfig/siteConfig.ts'),
        'export interface SiteConfig {}\n'
    );
    await fs.writeFile(
        path.join(siteDir, 'siteConfig.ts'),
        "throw new Error('Must not load optional site config');\n"
    );
    await fs.writeFile(path.join(siteDir, 'package.json'), JSON.stringify({ private: true }));
    await fs.writeFile(
        path.join(siteDir, 'tsconfig.json'),
        JSON.stringify({
            compilerOptions: {
                target: 'ESNext',
                module: 'ESNext',
                moduleResolution: 'bundler',
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                noEmit: true,
                types: ['node']
            },
            include: ['updateSync/**/*.ts', 'src/**/*.ts']
        })
    );
    await fs.mkdir(path.join(siteDir, 'node_modules'), { recursive: true });
    for (const name of ['@types', 'chokidar', 'dotenv', 'es-toolkit', 'js-yaml', 'minimist', 'tsx']) {
        await fs.symlink(path.resolve('node_modules', name), path.join(siteDir, 'node_modules', name), 'dir');
    }
};
