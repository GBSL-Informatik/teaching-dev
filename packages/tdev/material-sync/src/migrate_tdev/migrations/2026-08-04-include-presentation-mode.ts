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

    const config = await updateTdevConfig(root);
    ensureTdevConfig(config, [
        {
            src: 'src/theme/AnnouncementBar',
            dst: 'src/theme/AnnouncementBar'
        }
    ]);
    await writeUpdateTdevConfig(root, config);
    await $`yarn run updateTdev`;

    await $`git add .`;
    await $`git commit -m ${'[tdev] include presentation mode.'}`;
    await $`git checkout main`;
    await $`git merge ${branchName}`;
    await $`git branch -d ${branchName}`;
    await $`git push`;
};

export default migrate;
