import { MigrationRunner } from '../constants';
import { packageJson } from '../helpers/loadFile';
import { execa } from 'execa';
import { writePackageJson } from '../helpers/writeFile';
import { modifyPackages } from '../helpers/actions';

const migrate: MigrationRunner = async (root, apiMode, managed): Promise<void> => {
    console.log('Starting TDEV migration: ', root);
    const $ = execa({ stdio: 'inherit' });

    const branchName = `migrate-${Date.now()}`;
    await $`git checkout -b ${branchName}`;

    await $`yarn run updateTdev`;

    // package.json
    const pkg = await packageJson(root);
    modifyPackages(pkg, {
        dependencies: {
            '@docusaurus/core': '^3.10.2',
            '@docusaurus/faster': '^3.10.2',
            '@docusaurus/preset-classic': '^3.10.2',
            '@docusaurus/theme-classic': '^3.10.2',
            '@docusaurus/theme-common': '^3.10.2',
            '@docusaurus/theme-mermaid': '^3.10.2'
        },
        devDependencies: {
            '@docusaurus/module-type-aliases': '^3.10.2',
            '@docusaurus/plugin-rsdoctor': '^3.10.2',
            '@docusaurus/tsconfig': '^3.10.2',
            '@docusaurus/types': '^3.10.2'
        }
    });
    await writePackageJson(root, pkg);
    await $`rm -rf node_modules`;
    await $`rm yarn.lock`;
    await $`yarn install`;

    await $`yarn format`;

    await $`git add .`;
    await $`git commit -m ${'[tdev] Update Docusaurus to v3.10.2'}`;
    await $`git checkout main`;
    await $`git merge ${branchName}`;
    await $`git branch -d ${branchName}`;
    await $`git push`;
};

export default migrate;
