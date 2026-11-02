import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { SiteConfig } from '../../src/siteConfig/siteConfig';
import { withSiteConfig } from '../../src/siteConfig/withSiteConfig';
import type { PackageDocsExtension } from './types';

export const loadPyodideDocsSync = async (packageDir: string): Promise<PackageDocsExtension | undefined> => {
    const packagePath = path.resolve(packageDir, 'tdev/pyodide-code');
    try {
        await fs.access(packagePath);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return;
        }
        throw error;
    }

    // Keep optional package code out of both the runtime and TypeScript import graph.
    const modulePath = pathToFileURL(path.join(packagePath, 'docsSync/index.ts')).href;
    const adapter = (await import(modulePath)) as {
        createDocsSync: (siteConfig: SiteConfig) => PackageDocsExtension;
    };
    return adapter.createDocsSync(await withSiteConfig());
};
