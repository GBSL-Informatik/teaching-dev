import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const TEST_MATERIAL_CONFIG_PATH = 'src/siteConfig/tests/assets/material.config.yaml';

describe('resolveEditUrl', () => {
    const originalMaterialConfigPath = process.env.MATERIAL_CONFIG_PATH;

    beforeEach(() => {
        process.env.MATERIAL_CONFIG_PATH = TEST_MATERIAL_CONFIG_PATH;
        vi.resetModules();
    });

    afterEach(() => {
        if (typeof originalMaterialConfigPath === 'undefined') {
            delete process.env.MATERIAL_CONFIG_PATH;
        } else {
            process.env.MATERIAL_CONFIG_PATH = originalMaterialConfigPath;
        }
        vi.resetModules();
    });

    it('resolves edit URL for nesting level 1 for a given doc path version', async () => {
        const { resolveEditUrl } = await import('../helpers');
        const getEditUrl = resolveEditUrl();

        const editUrl = getEditUrl({
            version: '28Ga',
            docPath: '01-BYOD/01-intro.mdx',
            versionDocsDirPath: 'versioned_docs/version-28Ga'
        });

        expect(editUrl).toBe('docs/OF-BYOD-Basics/01-intro.mdx');
    });
    it('resolves edit URL for nesting level 2 for a given doc path version', async () => {
        const { resolveEditUrl } = await import('../helpers');
        const getEditUrl = resolveEditUrl();

        const editUrl = getEditUrl({
            version: '28Ga',
            docPath: '01-BYOD/02-software/01-intro.mdx',
            versionDocsDirPath: 'versioned_docs/version-28Ga'
        });

        expect(editUrl).toBe('docs/OF-BYOD-Basics/02-software/01-intro.mdx');
    });
    it('returns default edit URL for unknown versions', async () => {
        const { resolveEditUrl } = await import('../helpers');
        const getEditUrl = resolveEditUrl();

        const editUrl = getEditUrl({
            version: '28Gz',
            docPath: '01-BYOD/02-software/01-intro.mdx',
            versionDocsDirPath: 'versioned_docs/version-28Gz'
        });

        expect(editUrl).toBe('versioned_docs/version-28Gz/01-BYOD/02-software/01-intro.mdx');
    });
    it('returns default edit URL for unknown entry', async () => {
        const { resolveEditUrl } = await import('../helpers');
        const getEditUrl = resolveEditUrl();

        const editUrl = getEditUrl({
            version: '28Ga',
            docPath: '03-FOO/BAR/01-intro.mdx',
            versionDocsDirPath: 'versioned_docs/version-28Ga'
        });

        expect(editUrl).toBe('versioned_docs/version-28Ga/03-FOO/BAR/01-intro.mdx');
    });
    it('resolves edit URL for different version', async () => {
        const { resolveEditUrl } = await import('../helpers');
        const getEditUrl = resolveEditUrl();

        const editUrl = getEditUrl({
            version: '28Wa',
            docPath: '10-WINF/index.mdx',
            versionDocsDirPath: 'versioned_docs/version-28Wa'
        });

        expect(editUrl).toBe('docs/WMS-WINF/index.mdx');
    });
    it('resolves nested docs correctly when having ignored entries', async () => {
        const { resolveEditUrl } = await import('../helpers');
        const getEditUrl = resolveEditUrl();

        const resolvedEditUrl = getEditUrl({
            version: '28Ga',
            docPath: '03-Programmieren/01-foo/index.mdx',
            versionDocsDirPath: 'versioned_docs/version-28Ga'
        });

        expect(resolvedEditUrl).toBe('docs/OF-Programmieren-1/01-foo/index.mdx');

        const editUrl = getEditUrl({
            version: '28Ga',
            docPath: '03-Programmieren/12-rekursion/index.mdx',
            versionDocsDirPath: 'versioned_docs/version-28Ga'
        });

        expect(editUrl).toBe('versioned_docs/version-28Ga/03-Programmieren/12-rekursion/index.mdx');
    });
});
