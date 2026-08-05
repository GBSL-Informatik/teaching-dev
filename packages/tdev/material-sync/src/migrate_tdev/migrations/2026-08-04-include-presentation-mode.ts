import { MigrationRunner } from '../constants';
import { execa } from 'execa';
import { packageJson, updateTdevConfig } from '../helpers/loadFile';
import { ensureTdevConfig, modifyPackages } from '../helpers/actions';
import { writePackageJson, writeUpdateTdevConfig } from '../helpers/writeFile';

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

    // package.json
    const pkg = await packageJson(root);
    modifyPackages(pkg, {
        dependencies: {
            'ace-builds': '^1.44.0',
            'better-auth': '^1.6.26',
            mobx: '^7.0.0',
            'mobx-react-lite': '^5.0.0',
            'react-ace': '^15.0.0'
        }
    });
    await writePackageJson(root, pkg);
    await $`rm -rf node_modules`;
    await $`rm yarn.lock`;
    await $`yarn install`;
    await $`yarn format`;

    await $`git add .`;
    await $`git commit -m ${'[tdev] update dependencies with mobx@7.'}`;

    await $`git checkout main`;
    await $`git merge ${branchName}`;
    await $`git branch -d ${branchName}`;
    await $`git push`;
};

export default migrate;
