import fs from 'node:fs/promises';
import path from 'node:path';
import { REPO_ROOT, PACKAGE_ROOT, pathExistsSync } from '../helpers.js';
import readOrCreateMigrationConfig from './helpers/readOrCreateMigrationConfig.js';
import { loadMigrationRunners } from './helpers/loadMigrationRunners.js';
import { gitEnsureClean } from './helpers/actions.js';
import minimist from 'minimist';

process.chdir(REPO_ROOT);
const argv = minimist(process.argv.slice(2));

if (argv.help) {
    console.log(`
yarn workspace @tdev/material-sync migrateTdev [[--only="inf-abc,inf-ccd"]] [[--skip="inf-abc,inf-ccd"]]

    --only: Comma-separated list of tdev pages to migrate (pages including the specified name in the path)
    --skip: Comma-separated list of tdev pages to skip (pages *not* including the specified name in the path)

examples:

yarn workspace @tdev/material-sync migrateTdev                              # --> migrates all tdev pages listed in migrateTdev.config.yaml
yarn workspace @tdev/material-sync migrateTdev --only="inf-abc,inf-ccd"     # --> migrates only inf-abc and inf-ccd
yarn workspace @tdev/material-sync migrateTdev --only="inf-"                # --> migrates only pages with "inf-" in the path
yarn workspace @tdev/material-sync migrateTdev --skip="inf-abc,inf-ccd"     # --> migrates all except inf-abc and inf-ccd
`);
    process.exit(0);
}

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
    for await (const { path: migrationPath, runner: runMigration } of loadMigrationRunners()) {
        for (const tdevPage of pagesToMigrate) {
            try {
                const projectRoot = path.join(REPO_ROOT, tdevPage.path);
                if (!pathExistsSync(projectRoot)) {
                    console.warn(`Project root does not exist: ${projectRoot}. Skipping migration.`);
                    continue;
                }
                process.chdir(projectRoot);
                await gitEnsureClean('main');
                await runMigration(projectRoot, tdevPage.apiMode, tdevPage.managed);
                await fs.rename(migrationPath, migrationPath.replace(/\.ts$/, '.done.ts'));
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
