import fs from 'fs/promises';
import { getPackageDocsConfigs, syncDocsFolder } from './actions';
import path from 'path';

const packageDocsSync = async (packageDir: string, destDir: string) => {
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
            for (const ext of ['.json', '.yaml', '.yml']) {
                const categoryFileSrc = path.join(orgSrc, `_category_${ext}`);
                try {
                    const stat = await fs.stat(categoryFileSrc);
                    if (stat.isFile()) {
                        const categoryFileDest = path.join(destPath, org, `_category_${ext}`);
                        await fs.mkdir(path.dirname(categoryFileDest), { recursive: true });
                        await fs.copyFile(categoryFileSrc, categoryFileDest);
                        return `✅ Copied ${org} _category_ file`;
                    }
                } catch {}
            }
        }),
        ...['.json', '.yaml', '.yml'].map(async (ext) => {
            const orgSrc = path.join(srcPath);
            const categoryFileSrc = path.join(orgSrc, `_category_${ext}`);
            try {
                const stat = await fs.stat(categoryFileSrc);
                if (stat.isFile()) {
                    const categoryFileDest = path.join(destPath, `_category_${ext}`);
                    await fs.mkdir(path.dirname(categoryFileDest), { recursive: true });
                    await fs.copyFile(categoryFileSrc, categoryFileDest);
                    return '✅ Copied root _category_ file';
                }
            } catch {}
        })
    ]);
    console.log(result.filter(Boolean).join('\n'));
    return result;
};

export default packageDocsSync;
