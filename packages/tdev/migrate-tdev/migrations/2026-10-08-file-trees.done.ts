import { execa } from 'execa';
import { MigrationRunner } from '../src/constants';
import { modifyPackages } from '../src/helpers/actions';
import { packageJson } from '../src/helpers/loadFile';
import { writePackageJson } from '../src/helpers/writeFile';

const migrate: MigrationRunner = async (root, name): Promise<void> => {
    const $ = execa({ stdio: 'inherit' });

    const branchName = `migrate-${name}`;
    await $`git checkout -b ${branchName}`;

    await $`yarn run updateTdev`;

    // package.json
    const pkg = await packageJson(root);
    modifyPackages(pkg, {
        dependencies: {
            '@pierre/trees': '^1.0.0-beta.6'
        }
    });
    await writePackageJson(root, pkg);

    await $`rm -rf node_modules`;
    await $`rm yarn.lock`;
    await $`yarn install`;

    await $`yarn format`;

    await $`git add .`;
    await $`git commit -m ${'[tdev] feat: rework file trees https://github.com/GBSL-Informatik/teaching-dev/pull/324'}`;
    await $`git checkout main`;
    await $`git merge ${branchName}`;
    await $`git branch -d ${branchName}`;
    await $`git push`;
};

export default migrate;
