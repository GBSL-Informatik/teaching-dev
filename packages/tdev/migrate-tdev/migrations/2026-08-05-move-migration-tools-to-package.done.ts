import { MigrationRunner } from '../src/constants';
import { execa } from 'execa';
import { updateTdevConfig } from '../src/helpers/loadFile';
import { ensureTdevConfig } from '../src/helpers/actions';
import { writeUpdateTdevConfig } from '../src/helpers/writeFile';

const migrate: MigrationRunner = async (root, name): Promise<void> => {
    const $ = execa({ stdio: 'inherit' });

    const branchName = `migrate-${name}`;
    await $`git checkout -b ${branchName}`;

    const updateConfig = await updateTdevConfig(root);
    ensureTdevConfig(updateConfig, [
        {
            src: 'packages/tdev/',
            dst: 'packages/tdev',
            ignore: ['migrate-tdev/migrations']
        }
    ]);
    await writeUpdateTdevConfig(root, updateConfig);
    await $`yarn run updateTdev`;
    // register new package by installing
    await $`yarn install`;

    await $`git add .`;
    await $`git commit -m ${'[tdev] move migration tools to package.'}`;
    await $`git checkout main`;
    await $`git merge ${branchName}`;
    await $`git branch -d ${branchName}`;
    await $`git push`;
};

export default migrate;
