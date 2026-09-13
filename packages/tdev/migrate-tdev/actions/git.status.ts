import { execa } from 'execa';
import { MigrationRunner } from '../src/constants';

const migrate: MigrationRunner = async (root, name): Promise<void> => {
    const $ = execa({ stdio: 'inherit' });
    await $`git status`;
};

export default migrate;
