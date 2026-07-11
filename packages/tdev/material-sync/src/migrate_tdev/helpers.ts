import { Config } from '@site/updateSync/types';
import { type PackageJson } from './loadFile';
import { execa } from 'execa';

export const ensureTdevConfig = (config: Config, ensure: Config['trackedElements']) => {
    for (const element of ensure) {
        const existingElement = config.trackedElements.find((el) => el.src === element.src);
        if (existingElement) {
            existingElement.dst = element.dst;
            if (element.ignore) {
                existingElement.ignore = element.ignore;
            }
            if (element.protect) {
                existingElement.protect = element.protect;
            }
        } else {
            config.trackedElements.push(element);
        }
    }
};

export const modifyPackages = (
    pkg: PackageJson,
    ensure: Partial<PackageJson> = {},
    remove: string[] = []
) => {
    const removeSet = new Set(remove.filter((name) => !name.endsWith('*')));
    const removePrefix = remove.filter((name) => name.endsWith('*')).map((name) => name.slice(0, -1));
    for (const key of Object.keys(pkg.dependencies)) {
        if (removeSet.has(key)) {
            delete pkg.dependencies[key];
        }
        if (removePrefix.some((prefix) => key.startsWith(prefix))) {
            delete pkg.dependencies[key];
        }
    }
    for (const key of Object.keys(pkg.devDependencies)) {
        if (removeSet.has(key)) {
            delete pkg.devDependencies[key];
        }
    }

    for (const [key, value] of Object.entries(ensure?.dependencies ?? {})) {
        pkg.dependencies[key] = value;
    }
    for (const [key, value] of Object.entries(ensure?.devDependencies ?? {})) {
        pkg.devDependencies[key] = value;
    }
};

export const gitEnsureClean = async (ensureBranch?: string) => {
    // ensure qith execa that git has no tracked changes, otherwise migration will fail
    const { stdout: gitStatusUnclean } = await execa`git status --porcelain`;
    if (gitStatusUnclean) {
        const { stdout: pwd } = await execa`pwd`;
        throw new Error(
            `Git has uncommitted changes in ${pwd}. Please commit or stash them before running the migration.`
        );
    }
    if (ensureBranch) {
        const { stdout: gitBranch } = await execa`git rev-parse --abbrev-ref HEAD`;
        if (gitBranch !== ensureBranch) {
            await execa`git checkout ${ensureBranch}`;
        }
    }
    await execa`git pull`;
};
