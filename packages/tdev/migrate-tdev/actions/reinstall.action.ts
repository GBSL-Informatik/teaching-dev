import { execa } from 'execa';
import { MigrationRunner } from '../src/constants';

const migrate: MigrationRunner = async (root, name): Promise<void> => {
    const $ = execa({ stdio: 'inherit' });

    await $`yarn run updateTdev`;
    await $`rm -rf node_modules`;
    await $`rm yarn.lock`;
    await $`yarn install`;

    await $`git add .`;
    const message = `[tdev] clean install dependencies`;
    await $`git commit -m ${message}`;
    await $`git push`;
};

export default migrate;
