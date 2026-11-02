import fs from 'fs/promises';
import path from 'path';
import { getPackageDocsConfigs, syncCategoryFile, syncDocsFolder } from './actions';
import type { PackageDocsExtension } from './types';

const packageDocsSync = async (packageDir: string, destDir: string, extension?: PackageDocsExtension) => {
    const srcPath = path.resolve(process.cwd(), packageDir);
    const data = await getPackageDocsConfigs(srcPath);
    // create the dest dir if it doesn't exist
    const destPath = path.resolve(process.cwd(), destDir);
    await fs.rm(destPath, { recursive: true, force: true });
    await fs.mkdir(destPath, { recursive: true });
    /**
     * add .gitignore to destPath to ignore all files
     */
    const gitignorePath = path.join(destPath, '.gitignore');
    const gitignoreContent = '*\n!.gitignore\n';
    await fs.writeFile(gitignorePath, gitignoreContent, 'utf8');
    const orgs = [...new Set(data.map((cfg) => cfg.docs.org))];
    const result = await Promise.all([
        ...data.map(async (pkgConfig) => {
            return syncDocsFolder(pkgConfig, destPath);
        }),
        ...orgs.map(async (org) => {
            const orgSrc = path.join(srcPath, org);
            return syncCategoryFile(orgSrc, path.join(destPath, org));
        }),
        syncCategoryFile(srcPath, destPath)
    ]);
    await extension?.sync(destPath);
    console.log(result.filter(Boolean).join('\n'));
    return result;
};

export default packageDocsSync;
