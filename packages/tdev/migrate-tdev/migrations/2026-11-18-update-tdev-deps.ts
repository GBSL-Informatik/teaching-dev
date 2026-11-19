import { execa } from 'execa';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MigrationRunner } from '../src/constants';
import { searchAndReplace } from '../src/helpers/searchAndReplace';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tdevRoot = path.join(__dirname, '..', '..', '..', '..');

const migrate: MigrationRunner = async (root, name, ts, conf, argv): Promise<void> => {
    const $ = execa({ cwd: root, stdio: 'inherit' });
    const branchName = `migrate-${name}`;
    await $`git checkout -b ${branchName}`;
    await $`yarn run updateTdev`;
    await $`yarn install`;
    await $`yarn add -W fake-indexeddb@6.2.7`;

    await searchAndReplace(path.join(root, 'siteConfig.ts'), [
        {
            pattern: /showEditThisPageOptions\:.*\n/,
            replacement: `showEditThisPageOptions: ['github', 'github-dev', 'cms'],\n        editThisPageCmsUrl: 'https://teaching-dev.gbsl.website/cms',\n`
        }
    ]);

    await $`git add .`;
    const commitMsg = `[tdev] Update core

https://github.com/GBSL-Informatik/teaching-dev/pull/361
https://github.com/GBSL-Informatik/teaching-dev/pull/363
https://github.com/GBSL-Informatik/teaching-dev/pull/364
https://github.com/GBSL-Informatik/teaching-dev/pull/365
https://github.com/GBSL-Informatik/teaching-dev/pull/366
https://github.com/GBSL-Informatik/teaching-dev/pull/368
https://github.com/GBSL-Informatik/teaching-dev/pull/370
https://github.com/GBSL-Informatik/teaching-dev/pull/371
https://github.com/GBSL-Informatik/teaching-dev/pull/372
https://github.com/GBSL-Informatik/teaching-dev/pull/373
https://github.com/GBSL-Informatik/teaching-dev/pull/375
https://github.com/GBSL-Informatik/teaching-dev/pull/376
https://github.com/GBSL-Informatik/teaching-dev/pull/378
https://github.com/GBSL-Informatik/teaching-dev/pull/379
https://github.com/GBSL-Informatik/teaching-dev/pull/380
https://github.com/GBSL-Informatik/teaching-dev/pull/381
https://github.com/GBSL-Informatik/teaching-dev/pull/382
https://github.com/GBSL-Informatik/teaching-dev/pull/383
https://github.com/GBSL-Informatik/teaching-dev/pull/384

`;
    await $`git commit -m ${commitMsg}`;

    await $`git checkout main`;
    await $`git merge ${branchName}`;
    await $`git branch -d ${branchName}`;
};

export default migrate;
