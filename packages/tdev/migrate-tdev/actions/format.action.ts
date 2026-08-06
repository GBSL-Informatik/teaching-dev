import { MigrationRunner } from '../src/constants';
import { execa } from 'execa';

const migrate: MigrationRunner = async (root, name): Promise<void> => {
    const $ = execa({ stdio: 'inherit' });

    await $`yarn format`;

    await $`git add .`;
    const message = `[tdev] format codebase`;
    await $`git commit -m ${message}`;
    await $`git push`;
};

export default migrate;
