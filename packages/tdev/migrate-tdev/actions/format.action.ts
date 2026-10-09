import { execa } from 'execa';
import { MigrationRunner } from '../src/constants';
import { getCommitMessage } from '../src/helpers/commitMessages';

const migrate: MigrationRunner = async (root, name, ts, conf, argv): Promise<void> => {
    const $ = execa({ stdio: 'inherit' });

    await $`yarn format`;

    await $`git add .`;
    const message = getCommitMessage(argv, `format codebase at ${new Date().toISOString().split('T')[0]}`);
    await $`git commit -m ${message}`;
    await $`git push`;
};

export default migrate;
