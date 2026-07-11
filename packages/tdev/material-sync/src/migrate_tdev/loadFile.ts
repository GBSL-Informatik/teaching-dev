import path from 'node:path';
import fs from 'node:fs/promises';
import { load as yamlLoad } from 'js-yaml';
import { Config } from '@site/updateSync/types';

// add overload signatures for loadFile function: `${string}.json` and `${string}.yaml` or `${string}.yml` should return a Promise<T extends Object> and any other string should return a Promise<string>

async function loadFile<T extends object>(filePath: `${string}.json`): Promise<T>;
async function loadFile<T extends object>(filePath: `${string}.yaml`): Promise<T>;
async function loadFile<T extends object>(filePath: `${string}.yml`): Promise<T>;
async function loadFile<T>(filePath: string): Promise<string | T> {
    const fileExtension = path.extname(filePath).toLowerCase();
    try {
        const data = await fs.readFile(filePath, 'utf8');
        switch (fileExtension) {
            case '.json':
                return JSON.parse(data) as T; // Validate JSON
            case '.yaml':
            case '.yml':
                return yamlLoad(data) as T; // Validate YAML
        }
        console.warn(`Unsupported file extension: ${fileExtension}. Returning raw data.`);
        return data as T;
    } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
        throw err;
    }
}

export interface PackageJson {
    name: string;
    version: string;
    scripts?: Record<string, string>;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    peerDependencies?: Record<string, string>;
    [key: string]: any; // Allow additional properties
}

export const packageJson = (projectRootPath: string): Promise<PackageJson> => {
    const packageJsonPath = path.join(projectRootPath, 'package.json') as `${string}.json`;
    return loadFile<PackageJson>(packageJsonPath);
};

export const updateTdevConfig = (projectRootPath: string): Promise<Config> => {
    const updateTdevConfigPath = path.join(projectRootPath, 'updateTdev.config.yaml') as `${string}.yaml`;
    return loadFile<Config>(updateTdevConfigPath);
};

export default loadFile;
