import { LoadContext, PluginModule } from '@docusaurus/types';
import fs from 'fs/promises';
import { getPackageDocsConfigs, syncDocsFolder } from './actions';
import path from 'path';

export interface Config {
    packageDir: string;
    destDir: string;
}

const packageDocsSync: PluginModule = (context: LoadContext, options) => {
    const opts = options as Config;
    return {
        name: 'package-docs-sync-plugin',
        async loadContent() {
            const data = await getPackageDocsConfigs(path.resolve(process.cwd(), opts.packageDir));
            // create the dest dir if it doesn't exist
            const destPath = path.resolve(process.cwd(), opts.destDir);
            await fs.rm(destPath, { recursive: true, force: true });
            await fs.mkdir(destPath, { recursive: true });
            /**
             * add .gitignore to destPath to ignore all files
             */
            const gitignorePath = path.join(destPath, '.gitignore');
            const gitignoreContent = '*\n!.gitignore\n';
            await fs.writeFile(gitignorePath, gitignoreContent, 'utf8');
            /**
             * copy the package docs according to the config with rsync.
             * Ensure the copied files are read only.
             * When an include is specified, only copy those files/folders.
             * When an exclude is specified, do not copy those files/folders (exclude wins over include when both are specified).
             * Use rsync options to achieve this.
             * Perform asynchronously.
             * Copy the content to the root of `destPath/<org>/<package>/`.
             */
            const result = await Promise.all(
                data.map(async (pkgConfig) => {
                    return syncDocsFolder(pkgConfig, destPath);
                })
            );
            console.log(result.join('\n'));
            return;
        }
    };
};

export default packageDocsSync;
