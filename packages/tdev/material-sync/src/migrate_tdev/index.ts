import fs from 'node:fs/promises';
import path from 'node:path';
import Rsync from 'rsync';
import { REPO_ROOT, PACKAGE_ROOT, pathExistsSync } from '../helpers.js';
import { fileURLToPath } from 'node:url';
import readOrCreateMigrationConfig from './helpers/readOrCreateMigrationConfig.js';
import { MIGRATION_PATH } from './constants.js';
import { loadMigrationRunners } from './helpers/loadMigrationRunners.js';
import { gitEnsureClean } from './helpers/actions.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.chdir(REPO_ROOT);

const main = async (): Promise<void> => {
    const config = await readOrCreateMigrationConfig();
    console.log('Migrating...', MIGRATION_PATH);
    for await (const runMigration of loadMigrationRunners()) {
        for (const tdevPage of config.tdevPages) {
            try {
                const projectRoot = path.join(REPO_ROOT, tdevPage.path);
                if (!pathExistsSync(projectRoot)) {
                    console.warn(`Project root does not exist: ${projectRoot}. Skipping migration.`);
                    continue;
                }
                process.chdir(projectRoot);
                await gitEnsureClean('main');
                await runMigration(projectRoot, tdevPage.apiMode, tdevPage.managed);
            } finally {
                process.chdir(REPO_ROOT);
            }
        }
    }
};

main()
    .catch((e: Error) => {
        console.error(e);
        process.exit(1);
    })
    .then(() => {
        process.exit(0);
    });
