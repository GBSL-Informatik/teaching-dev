import { MigrationRunner } from '../src/constants';
import { execa } from 'execa';

const migrate: MigrationRunner = async (root, name): Promise<void> => {
    const $ = execa({ stdio: 'inherit' });
    await $`git status`;
};

export default migrate;
