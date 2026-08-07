import { MigrationRunner } from '../src/constants';

const migrate: MigrationRunner = async (root, name): Promise<void> => {
    console.log(
        `Prestep of this action called "gitEnsureClean" and already ensures a clean and up-to-date git state`
    );
};

export default migrate;
