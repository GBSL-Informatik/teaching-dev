import { MigrationRunner } from '../src/constants';
import { execa } from 'execa';

const migrate: MigrationRunner = async (root, name): Promise<void> => {
    const $ = execa({ stdio: 'inherit' });

    await $`yarn run updateTdev`;
    await $`yarn install`;
    await $`yarn format`;

    await $`git add .`;
    const message = `[tdev] update tdev core on ${new Date().toISOString().split('T')[0]}`;
    await $`git commit -m ${message}`;
    await $`git push`;
};

export default migrate;
