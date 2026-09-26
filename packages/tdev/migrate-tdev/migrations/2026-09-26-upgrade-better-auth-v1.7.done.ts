import { execa } from 'execa';
import path from 'node:path';
import { MigrationRunner } from '../src/constants';
import { modifyPackages } from '../src/helpers/actions';
import loadFile, { packageJson } from '../src/helpers/loadFile';
import writeFile, { writePackageJson } from '../src/helpers/writeFile';

const migrate: MigrationRunner = async (root, name): Promise<void> => {
    const $ = execa({ stdio: 'inherit' });

    const branchName = `migrate-${name}`;
    await $`git checkout -b ${branchName}`;

    await $`yarn run updateTdev`;

    // package.json
    const pkg = await packageJson(root);
    modifyPackages(pkg, {
        dependencies: {
            'better-auth': '^1.7.4'
        }
    });
    await writePackageJson(root, pkg);

    // add vscode editor.codeActionsOnSave config to organize imports on save
    const vscodeSettingsPath = path.join(root, '.vscode/settings.json') as `${string}.json`;
    const vscodeSettings = await loadFile<Record<string, Record<string, string>>>(vscodeSettingsPath);
    if (!vscodeSettings['editor.codeActionsOnSave']) {
        vscodeSettings['editor.codeActionsOnSave'] = {};
    }
    if (!vscodeSettings['editor.codeActionsOnSave']['source.organizeImports']) {
        vscodeSettings['editor.codeActionsOnSave']['source.organizeImports'] = 'explicit';
        await writeFile(vscodeSettingsPath, vscodeSettings);
    }

    await $`rm -rf node_modules`;
    await $`rm yarn.lock`;
    await $`yarn install`;

    await $`yarn format`;

    await $`git add .`;
    await $`git commit -m ${'[tdev] Update better-auth to v1.7.4 and auto organize imports on save'}`;
    await $`git checkout main`;
    await $`git merge ${branchName}`;
    await $`git branch -d ${branchName}`;
    await $`git push`;
};

export default migrate;
