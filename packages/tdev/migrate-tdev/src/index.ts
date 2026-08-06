import fs from 'node:fs/promises';
import path from 'node:path';
import readOrCreateMigrationConfig from './helpers/readOrCreateMigrationConfig.js';
import { loadMigrationRunners } from './helpers/loadMigrationRunners.js';
import { gitEnsureClean } from './helpers/actions.js';
import minimist from 'minimist';
import { pathExists, REPO_ROOT } from './helpers/base.js';
import { MIGRATION_PATH } from './constants.js';

process.chdir(REPO_ROOT);
const argv = minimist(process.argv.slice(2));

if (argv.help) {
    console.log(`
yarn workspace @tdev/migrate-tdev migrate [[--only="inf-abc,inf-ccd"]] [[--skip="inf-abc,inf-ccd"]]

    --only: Comma-separated list of tdev pages to migrate (pages including the specified name in the path)
    --skip: Comma-separated list of tdev pages to skip (pages *not* including the specified name in the path)
    --done: force renames the migration file to .done.ts after successful migration (default: when no --only or --skip is specified)
    --branch: Specify the branch to checkout on the migrated project before running the action (default: main). The branch must exist.

examples:

yarn workspace @tdev/migrate-tdev migrate                              # --> migrates all tdev pages listed in migrateTdev.config.yaml
yarn workspace @tdev/migrate-tdev migrate --only="inf-abc,inf-ccd"     # --> migrates only inf-abc and inf-ccd
yarn workspace @tdev/migrate-tdev migrate --only="inf-"                # --> migrates only pages with "inf-" in the path
yarn workspace @tdev/migrate-tdev migrate --skip="inf-abc,inf-ccd"     # --> migrates all except inf-abc and inf-ccd
yarn workspace @tdev/migrate-tdev migrate --only="inf-" --done         # --> forces renaming of migration file to .done.ts after successful migration
`);
    process.exit(0);
}

const doneFlag = argv.done === true || argv.done === 'true' || argv.done === '1';

const onlyPages: string[] = argv.only
    ? (argv.only as string)
          .split(',')
          .map((s) => s.trim())
          .filter((s): s is string => !!s)
    : [];
const skipPages: string[] = argv.skip
    ? (argv.skip as string)
          .split(',')
          .map((s) => s.trim())
          .filter((s): s is string => !!s)
    : [];

const branch: string = argv.branch ? (argv.branch as string) : 'main';

const main = async (): Promise<void> => {
    const config = await readOrCreateMigrationConfig();
    const pagesToMigrate = config.tdevPages.filter((page) => {
        let include = true;
        if (onlyPages.length > 0) {
            include = onlyPages.some((only) => page.path.includes(only));
        }
        if (skipPages.length > 0) {
            include = include && !skipPages.some((skip) => page.path.includes(skip));
        }
        return include;
    });
    console.log(
        `Migrating ${pagesToMigrate.length} tdev pages:`,
        pagesToMigrate.map((p) => p.path)
    );
    const failedMigrationPaths: string[] = [];
    const successfulMigrationPaths: string[] = [];
    const now = Date.now();
    for await (const { path: migrationPath, migrationName, runner: runMigration } of loadMigrationRunners()) {
        for (const tdevPage of pagesToMigrate) {
            const migrationFileName = `${MIGRATION_PATH.replace(REPO_ROOT, '.')}/${migrationName}.ts`;
            console.log(`@ ${tdevPage.path}: run  ${migrationFileName}`);
            try {
                const projectRoot = path.join(REPO_ROOT, tdevPage.path);
                const hasProjectRoot = await pathExists(projectRoot);
                if (!hasProjectRoot) {
                    console.warn(`Project root does not exist: ${projectRoot}. Skipping migration.`);
                    continue;
                }
                process.chdir(projectRoot);
                await gitEnsureClean(branch);
                await runMigration(projectRoot, migrationName, now, tdevPage);
                successfulMigrationPaths.push(migrationPath);
            } catch (error) {
                console.error(`Failed to migrate ${migrationName}:`, error);
                failedMigrationPaths.push(migrationPath);
            } finally {
                process.chdir(REPO_ROOT);
            }
        }
        if (doneFlag || (onlyPages.length === 0 && skipPages.length === 0)) {
            await fs.rename(migrationPath, migrationPath.replace(/\.ts$/, '.done.ts'));
        }
    }
    console.log(`Migration completed.
    ✅ Successful: ${successfulMigrationPaths.length}`);
    if (failedMigrationPaths.length > 0) {
        console.log(`    ❌ Failed: ${failedMigrationPaths.length}: ${failedMigrationPaths.join(', ')}`);
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
