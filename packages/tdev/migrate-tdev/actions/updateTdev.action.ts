import { MigrationRunner } from '../src/constants';
import { execa } from 'execa';
import { hasUncommittedChanges } from '../src/helpers/gitHelpers';

const migrate: MigrationRunner = async (root, name, ts, conf, argv): Promise<void> => {
    const $ = execa({ stdio: 'inherit' });

    await $`yarn run updateTdev`;
    await $`yarn install`;
    if (argv.format) {
        await $`yarn format`;
    }
    const hasChanged = await hasUncommittedChanges();
    if (!hasChanged) {
        console.log('No changes detected after updateTdev. Skipping commit and push.');
        await $`git push`;
        return;
    }

    await $`git add .`;
    const message = `[tdev] update tdev core on ${new Date().toISOString().split('T')[0]}`;
    await $`git commit -m ${message}`;
    await $`git push`;
};

export default migrate;
