import { execa } from 'execa';
import { MigrationRunner } from '../src/constants';
import { getCommitMessage } from '../src/helpers/commitMessages';

const migrate: MigrationRunner = async (root, name, ts, conf, argv): Promise<void> => {
    const $ = execa({ stdio: 'inherit' });

    await $`yarn run updateTdev`;
    await $`rm -rf node_modules`;
    await $`rm yarn.lock`;
    await $`yarn install`;

    await $`git add .`;

    const message = getCommitMessage(
        argv,
        `clean install dependencies at ${new Date().toISOString().split('T')[0]}`
    );
    await $`git commit -m ${message}`;
    await $`git push`;
};

export default migrate;
