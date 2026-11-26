import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pathExists } from '../src/helpers/index';
import { syncMaterials } from '../src/helpers/syncMaterials';

const writeFile = async (filePath: string, content = '') => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
};

describe('syncMaterials', () => {
    const originalCwd = process.cwd();
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'material-sync-'));
        process.chdir(tmpDir);
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        await writeFile('docs/first/intro.md');
        await writeFile('docs/first/keep/secret.md');
        await writeFile('docs/second/intro.md');
    });

    afterEach(async () => {
        process.chdir(originalCwd);
        vi.restoreAllMocks();
        await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it('syncs the remaining entries when an ignored path does not exist', async () => {
        await syncMaterials({
            '28Ga': [
                { from: 'docs/first', to: 'versioned_docs/version-28Ga/first', ignore: ['missing', 'keep'] },
                { from: 'docs/second', to: 'versioned_docs/version-28Ga/second', ignore: [] }
            ]
        });

        expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining('ignored "missing" does not exist')
        );
        expect(await pathExists('versioned_docs/version-28Ga/first/intro.md')).toBe(true);
        expect(await pathExists('versioned_docs/version-28Ga/first/keep')).toBe(false);
        expect(await pathExists('versioned_docs/version-28Ga/second/intro.md')).toBe(true);
        expect(await fs.readFile('versioned_docs/version-28Ga/.gitignore', 'utf-8')).toMatchInlineSnapshot(`
          "first/*
          !first/keep/
          second/*"
        `);
    });
});
