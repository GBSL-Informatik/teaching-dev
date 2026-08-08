import path from 'node:path';
import readOrCreateMigrationConfig from './helpers/readOrCreateMigrationConfig.js';
import { gitEnsureClean } from './helpers/actions.js';
import minimist from 'minimist';
import { pathExists, REPO_ROOT } from './helpers/base.js';
import { ACTIONS_PATH } from './constants.js';
import { loadActionRunner } from './helpers/loadActionRunner.js';
const LINE = '----------------------------------------------------------------------------------';

process.chdir(REPO_ROOT);
const argv = minimist(process.argv.slice(2));

if (argv.help) {
    console.log(`
yarn workspace @tdev/migrate-tdev runAction <action-name> [[--only="inf-abc,inf-ccd"]] [[--skip="inf-abc,inf-ccd"]] [[--branch="branch-name"]]

    --only: Comma-separated list of tdev pages to migrate (pages including the specified name in the path)
    --skip: Comma-separated list of tdev pages to skip (pages *not* including the specified name in the path)
    --branch: Specify the branch to checkout on the remote project before running the action (default: main). The branch must exist.

examples:

yarn workspace @tdev/migrate-tdev runAction format                              # --> runs the action actions/format.action.ts for all tdev pages listed in migrateTdev.config.yaml
yarn workspace @tdev/migrate-tdev runAction format --only="inf-abc,inf-ccd"     # --> runs the action actions/format.action.ts for only inf-abc and inf-ccd
yarn workspace @tdev/migrate-tdev runAction format --only="inf-"                # --> runs the action actions/format.action.ts for only pages with "inf-" in the path
yarn workspace @tdev/migrate-tdev runAction format --skip="inf-abc,inf-ccd"     # --> runs the action actions/format.action.ts for all except inf-abc and inf-ccd
yarn workspace @tdev/migrate-tdev runAction format --branch="feature-branch"    # --> checks out the feature-branch and pulls the latest changes before running the action
`);
    process.exit(0);
}

const requestedAction = argv._[0];
if (!requestedAction) {
    console.error('No action name specified. Use --help for usage information.');
    process.exit(1);
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
        `Running action for ${pagesToMigrate.length}/${config.tdevPages.length} tdev pages:`,
        pagesToMigrate.map((p) => p.path).join(', ')
    );
    const failedActionsPaths: string[] = [];
    const successfulActionsPaths: string[] = [];
    const now = Date.now();
    const { path: migrationPath, actionName, runner: runAction } = await loadActionRunner(requestedAction);
    for (const tdevPage of pagesToMigrate) {
        const migrationFileName = `${ACTIONS_PATH.replace(REPO_ROOT, '.')}/${actionName}.ts`;
        console.log(`  ${LINE}`);
        console.log(`  ➡️  ${tdevPage.path}: run  ${migrationFileName}\n`);
        try {
            const projectRoot = path.join(REPO_ROOT, tdevPage.path);
            const hasProjectRoot = await pathExists(projectRoot);
            if (!hasProjectRoot) {
                console.warn(`Project root does not exist: ${projectRoot}. Skipping action.`);
                continue;
            }
            process.chdir(projectRoot);
            await gitEnsureClean(branch);
            await runAction(projectRoot, actionName, now, tdevPage, argv);
            successfulActionsPaths.push(migrationPath);
            console.log(`\n    ✅ Action ${actionName} completed successfully for ${tdevPage.path}\n`);
        } catch (error) {
            console.error(`\n    ❌ Failed to run action ${actionName}:`);
            console.error(error);
            console.log('');
            failedActionsPaths.push(migrationPath);
        } finally {
            process.chdir(REPO_ROOT);
        }
    }
    console.log(`\n${LINE}--\nAction completed.
    ✅ Successful: ${successfulActionsPaths.length}`);
    if (failedActionsPaths.length > 0) {
        console.log(`    ❌ Failed: ${failedActionsPaths.length}: ${failedActionsPaths.join(', ')}`);
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
