import * as path from 'path';
import * as fs from 'fs';
import { intersection, difference } from 'lodash';
import { ReportBuilder } from './report';

interface PackageJson {
    dependencies: { [key: string]: string };
    devDependencies: { [key: string]: string };
}

interface DiffReport {
    upgradeable: {
        packageName: string;
        from: string;
        to: string;
    }[];
    downgradeable: {
        packageName: string;
        from: string;
        to: string;
    }[];
    installable: {
        packageName: string;
        version: string;
    }[];
}

const diffPackages = (
    localDeps: { [key: string]: string },
    tdevDeps: { [key: string]: string }
): DiffReport => {
    const localPackages = Object.keys(localDeps);
    const tdevPackages = Object.keys(tdevDeps);

    const commonDeps = intersection(localPackages, tdevPackages);
    const installableDeps = difference(tdevPackages, localPackages);

    return {
        installable: installableDeps.map((packageName) => ({
            packageName: packageName,
            version: tdevDeps[packageName]
        })),
        upgradeable: commonDeps
            .filter((packageName) => localDeps[packageName] < tdevDeps[packageName])
            .map((packageName) => ({
                packageName: packageName,
                from: localDeps[packageName],
                to: tdevDeps[packageName]
            })),
        downgradeable: commonDeps
            .filter((packageName) => localDeps[packageName] > tdevDeps[packageName])
            .map((packageName) => ({
                packageName: packageName,
                from: localDeps[packageName],
                to: tdevDeps[packageName]
            }))
    };
};

const loadPackageJson = (repoPath: string): PackageJson => {
    return JSON.parse(fs.readFileSync(path.resolve(repoPath, 'package.json'), 'utf8'));
};

export const calculateDependenciesDiff = (
    rootPath: string,
    teachingDevPath: string,
    reportBuilder: ReportBuilder
): any => {
    const localPackageJson = loadPackageJson(rootPath);
    const tdevPackageJson = loadPackageJson(teachingDevPath);

    const depsDiff = diffPackages(localPackageJson.dependencies, tdevPackageJson.dependencies);
    const devDepsDiff = diffPackages(localPackageJson.devDependencies, tdevPackageJson.devDependencies);

    if (depsDiff.installable.length + devDepsDiff.installable.length > 0) {
        reportBuilder.appendLine('\n⚠️  The following additional packages should be installed:');
        depsDiff.installable.length > 0 &&
            reportBuilder.appendLine(
                `yarn add -W ${depsDiff.installable.map((entry) => `${entry.packageName}@${entry.version}`).join(' ')}`
            );
        devDepsDiff.installable.length > 0 &&
            reportBuilder.appendLine(
                `yarn add -D ${devDepsDiff.installable.map((entry) => `${entry.packageName}@${entry.version}`).join(' ')}`
            );
    }

    if (depsDiff.upgradeable.length + devDepsDiff.upgradeable.length > 0) {
        reportBuilder.appendLine('\n⬆️  The following packages can be upgraded:');
        reportBuilder.appendLine(
            `yarn upgrade ${depsDiff.upgradeable
                .concat(devDepsDiff.upgradeable)
                .map((entry) => `${entry.packageName}@${entry.to}`)
                .join(' ')}`
        );
    }

    if (depsDiff.downgradeable.length + devDepsDiff.downgradeable.length > 0) {
        reportBuilder.appendLine('\n⬇️  Consider downgrading the following packages to match teaching-dev:');
        reportBuilder.appendLine(
            `yarn upgrade ${depsDiff.downgradeable
                .concat(devDepsDiff.downgradeable)
                .map((entry) => `${entry.packageName}@${entry.to}`)
                .join(' ')}`
        );
    }
};
