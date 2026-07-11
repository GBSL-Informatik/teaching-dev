import path from 'node:path';
import fs from 'node:fs/promises';
import { dump as yamlDump } from 'js-yaml';
import type { PackageJson } from './loadFile';
import { Config } from '@site/updateSync/types';

// add overload signatures for writeFile function: `${string}.json` and `${string}.yaml` or `${string}.yml` should return a Promise<T extends Object> and any other string should return a Promise<string>

async function writeFile<T extends object>(filePath: `${string}.json`, data: T): Promise<void>;
async function writeFile<T extends object>(filePath: `${string}.yaml`, data: T): Promise<void>;
async function writeFile<T extends object>(filePath: `${string}.yml`, data: T): Promise<void>;
async function writeFile<T>(filePath: string, data: T | string): Promise<void> {
    const fileExtension = path.extname(filePath).toLowerCase();
    try {
        const parentDir = path.dirname(filePath);
        await fs.mkdir(parentDir, { recursive: true });
        let fileData: string;
        switch (fileExtension) {
            case '.json':
                fileData = JSON.stringify(data, null, 4);
                break;
            case '.yaml':
            case '.yml':
                fileData = yamlDump(data, { indent: 4, lineWidth: -1 });
                break;
            default:
                fileData = data as string;
        }
        await fs.writeFile(filePath, fileData, 'utf8');
    } catch (err) {
        console.error(`Error writing file ${filePath}:`, err);
        throw err;
    }
}

export const writePackageJson = (projectRootPath: string, data: PackageJson): Promise<void> => {
    const packageJsonPath = path.join(projectRootPath, 'package.json') as `${string}.json`;
    return writeFile<PackageJson>(packageJsonPath, data);
};

export const writeUpdateTdevConfig = (projectRootPath: string, data: Config): Promise<void> => {
    const updateTdevConfigPath = path.join(projectRootPath, 'updateTdev.config.yaml') as `${string}.yaml`;
    return writeFile<Config>(updateTdevConfigPath, data);
};

export default writeFile;
