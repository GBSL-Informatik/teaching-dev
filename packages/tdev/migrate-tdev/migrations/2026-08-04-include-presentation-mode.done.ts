import { MigrationRunner } from '../src/constants';
import { execa } from 'execa';
import { packageJson, updateTdevConfig } from '../src/helpers/loadFile';
import { ensureTdevConfig, modifyPackages } from '../src/helpers/actions';
import { writePackageJson, writeUpdateTdevConfig } from '../src/helpers/writeFile';
import { filesContainingMatch } from '../src/helpers/filesContainingMatch';
import { applySearchAndReplace } from '../src/helpers/searchAndReplace';
import { hasUncommittedChanges } from '../src/helpers/gitHelpers';

const migrate: MigrationRunner = async (root, name): Promise<void> => {
    const $ = execa({ stdio: 'inherit' });
    await $`git checkout main`;
    await $`git pull`;

    const branchName = `migrate-${name}`;
    await $`git checkout -b ${branchName}`;

    const config = await updateTdevConfig(root);
    ensureTdevConfig(config, [
        {
            src: 'src/theme/AnnouncementBar/',
            dst: 'src/theme/AnnouncementBar/'
        }
    ]);
    await writeUpdateTdevConfig(root, config);
    await $`yarn run updateTdev`;

    await $`git commit -am ${'[tdev] include presentation mode.'}`;

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

    const files = await filesContainingMatch(root, `@observable\\.ref`);
    await applySearchAndReplace(files, [
        { pattern: '@observable\\.ref', replacement: '@observableRef' },
        {
            pattern: /^import {.*\b(observable)\b.*} from 'mobx'/gm,
            replacement: (match, args) => {
                return match.replace(/\b(observable)\b/g, 'observable, observableRef');
            }
        }
    ]);

    const hasChanges = await hasUncommittedChanges();
    if (hasChanges) {
        await $`git commit -am ${'[tdev] migrate imports to mobx@7 (using @observableRef instead of @observable.ref).'}`;
    }

    await $`git checkout main`;
    await $`git merge ${branchName}`;
    await $`git branch -d ${branchName}`;
    await $`git push`;
};

export default migrate;
