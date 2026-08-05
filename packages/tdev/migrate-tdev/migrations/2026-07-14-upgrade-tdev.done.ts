import { MigrationRunner } from '../src/constants';
import { execa } from 'execa';

const migrate: MigrationRunner = async (root, name): Promise<void> => {
    const $ = execa({ stdio: 'inherit' });

    const branchName = `migrate-${name}`;
    await $`git checkout -b ${branchName}`;

    await $`yarn run updateTdev`;
    await $`yarn install`;
    await $`yarn format`;

    await $`git add .`;
    await $`git commit -m ${'[tdev] Update tdev core'}`;
    await $`git checkout main`;
    await $`git merge ${branchName}`;
    await $`git branch -d ${branchName}`;
    await $`git push`;
};

export default migrate;
