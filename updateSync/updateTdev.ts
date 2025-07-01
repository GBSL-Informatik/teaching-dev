import * as fs from 'fs';
import * as path from 'path';
import { exec as execCallback, execSync } from 'child_process';
import { promisify } from 'util';
import * as yaml from 'js-yaml';
import { Config, TrackedElementConfig } from './types';
import { expandTilde } from './util';
import micromatch from 'micromatch';
import { calculateDependenciesDiff as determineDependenciesDiff } from './dependencyCheck';
import { ReportBuilder } from './report';

const SYNC_MARKER_FILENAME = '.updateTdev';
const CONFIG_FILENAME = 'updateTdev.config.yaml';

const exec = promisify(execCallback);

const rootPath = process.cwd();
const config = yaml.load(fs.readFileSync(path.resolve(rootPath, CONFIG_FILENAME), 'utf8')) as Config;
const teachingDevPath = path.resolve(expandTilde(config.tdevPath.trim()));
const reportDirPath = path.join(rootPath, 'build', 'updateTdev');

async function pullTeachingDev() {
    if (!fs.existsSync(teachingDevPath)) {
        console.error(`Repo ${teachingDevPath} does not exist.`);
        process.exit(1);
    }

    console.log(`🕊️   Performing branch check...`);

    process.chdir(teachingDevPath);

    const currentBranch: string = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    if (currentBranch !== config.expectedTdevBranch) {
        console.error('Error: teaching-dev is not on the expected branch.');
        console.error(`Expected: ${config.expectedTdevBranch}`);
        console.error(`Current: ${currentBranch}`);
        process.exit(1);
    }

    console.log(`✅  Branch check passed; teaching-dev is on '${config.expectedTdevBranch}' as expected.`);
    console.log('🚜  Performing git pull...');

    try {
        await exec('git pull');
        console.log('✅  Successfully pulled teaching-dev.');
    } catch (error) {
        console.error('Error: Failed to pull teaching-dev.');
        console.error(error);
        process.exit(1);
    }
}

function createRsyncCommand({ src, dst, ignore, protect }: TrackedElementConfig): string {
    const excludePatterns = ignore ? ignore.map((pattern) => `--exclude='${pattern}'`).join(' ') : '';
    const protectPatterns = protect
        ? protect.map((pattern) => `--filter='protect ${pattern}'`).join(' ')
        : '';

    return `rsync -av --delete ${excludePatterns} \
                ${protectPatterns} \
                ${path.join(teachingDevPath, src)} \
                ${path.join(rootPath, dst)} \
                --delete-after \
                --prune-empty-dirs`;
}

async function syncTrackedFiles() {
    for (const element of config.trackedElements) {
        const rsyncCommand = createRsyncCommand(element);

        try {
            await exec(rsyncCommand);
            console.log(`✅  Rsync command for tracked element ${element.dst} completed successfully.`);
        } catch (error) {
            console.error('Error: Failed to execute rsync.');
            console.error(error);
            process.exit(1);
        }
    }
}

async function getCurrentTeachingDevCommit(): Promise<string> {
    const { stdout: currentCommit } = await exec('git rev-parse HEAD', { cwd: teachingDevPath });
    return currentCommit.trim();
}

async function getLastSyncedCommit(): Promise<string | undefined> {
    const syncMarkerPath = path.join(rootPath, SYNC_MARKER_FILENAME);

    if (!fs.existsSync(syncMarkerPath)) {
        console.log(
            `⚠️   No tdev update marker yet, creating ./${SYNC_MARKER_FILENAME}\n    The file contains the current commit and enables tracking of changes to non-tracked files.`
        );
        return;
    }

    const syncMarkerFileContent = fs.readFileSync(syncMarkerPath, 'utf8');
    const match = syncMarkerFileContent.match(/CURRENT_COMMIT=(\w+)/);

    if (!match) {
        throw new Error(`Could not find CURRENT_COMMIT in ${SYNC_MARKER_FILENAME}`);
    }

    return match[1];
}

async function createReportFilename(lastSyncedCommit?: string) {
    return path.join(
        reportDirPath,
        `${Date.now()}_${lastSyncedCommit || 'untracked'}_to_${await getCurrentTeachingDevCommit()}.txt`
    );
}

async function determineNonTrackedFileChanges(
    lastSyncedCommit: string,
    reportBuilder: ReportBuilder
): Promise<void> {
    const { stdout } = await exec(`git diff --name-only ${lastSyncedCommit}..HEAD`, { cwd: teachingDevPath });

    const changedFiles = stdout.trim().split('\n').filter(Boolean);
    const filteredFiles = micromatch(changedFiles, config.watchedElements);

    if (filteredFiles.length > 0) {
        reportBuilder.appendLine('Non-tracked files changed since last update:');
        filteredFiles.forEach((file: string) => {
            reportBuilder.appendLine(`- ${file}`);
        });
    }
}

async function updateSyncMarker(): Promise<void> {
    try {
        const currentCommit = await getCurrentTeachingDevCommit();

        const syncMarkerPath = path.join(rootPath, SYNC_MARKER_FILENAME);
        if (!fs.existsSync(syncMarkerPath)) {
            fs.writeFileSync(syncMarkerPath, '');
        }

        const syncMarkerEntry = `CURRENT_COMMIT=${currentCommit}`;
        fs.writeFileSync(syncMarkerPath, syncMarkerEntry, 'utf8');

        console.log(`✅  Successfully updated ${syncMarkerPath} with commit SHA: ${currentCommit}`);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

async function updateTdev(): Promise<void> {
    try {
        await pullTeachingDev();
        await syncTrackedFiles();

        const lastSyncedCommit = await getLastSyncedCommit();
        const reportFilename = await createReportFilename(lastSyncedCommit);
        const reportBuilder = new ReportBuilder(reportDirPath, reportFilename);
        if (!!lastSyncedCommit) {
            await determineNonTrackedFileChanges(lastSyncedCommit, reportBuilder);
        }

        determineDependenciesDiff(rootPath, teachingDevPath, reportBuilder);

        await updateSyncMarker();

        reportBuilder.write();
        console.log('✅  Done.');
    } catch (error) {
        console.error('An unexpected error occurred:', error);
        process.exit(1);
    }
}

updateTdev();
