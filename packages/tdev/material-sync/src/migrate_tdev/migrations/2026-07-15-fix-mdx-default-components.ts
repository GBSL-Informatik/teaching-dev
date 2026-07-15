import { MigrationRunner } from '../constants';
import { execa } from 'execa';
import { updateTdevConfig } from '../helpers/loadFile';
import { ensureTdevConfig } from '../helpers/actions';
import { writeUpdateTdevConfig } from '../helpers/writeFile';

const migrate: MigrationRunner = async (root, apiMode, managed, timestamp): Promise<void> => {
    console.log('Starting TDEV migration: ', root);
    const $ = execa({ stdio: 'inherit' });

    const branchName = `migrate-${timestamp}`;
    await $`git checkout -b ${branchName}`;

    await $`rm -rf packages/tdev/material-sync/src/migrate_tdev/migrations`;
    const updateConfig = await updateTdevConfig(root);
    ensureTdevConfig(updateConfig, [
        {
            src: 'packages/tdev/',
            dst: 'packages/tdev',
            ignore: ['material-sync/src/migrate_tdev/migrations']
        }
    ]);
    await writeUpdateTdevConfig(root, updateConfig);
    await $`yarn run updateTdev`;

    await $`git add .`;
    await $`git commit -m ${'[tdev] ensure common mdx components are synced.'}`;
    await $`git checkout main`;
    await $`git merge ${branchName}`;
    await $`git branch -d ${branchName}`;
    await $`git push`;
};

export default migrate;
