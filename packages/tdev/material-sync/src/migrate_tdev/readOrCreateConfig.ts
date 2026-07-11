import fs from 'node:fs/promises';
import { pathExists } from '../helpers';
import { MIGRATION_CONFIG_PATH, MIGRATION_DEFAULT_CONFIG_PATH } from './constants';
import { load as yamlLoad } from 'js-yaml';

export interface MigrationConfig {
    tdevPages: {
        path: string;
        apiMode: 'api' | 'indexedDb' | 'memory';
        managed: 'fully' | 'partially' | 'none';
    }[];
}

const readOrCreateConfig = async (): Promise<MigrationConfig> => {
    const configExists = await pathExists(MIGRATION_CONFIG_PATH);
    if (!configExists) {
        console.log('migrateTdev.config.yaml does not exist. Do you want to create it? [y/n]');
        const answer = await new Promise<string>((resolve) => {
            process.stdin.once('data', (data) => {
                resolve(data.toString().trim());
            });
        });
        if (answer.toLowerCase() === 'y') {
            console.log('Creating migrateTdev.config.yaml...');
            await fs.copyFile(MIGRATION_DEFAULT_CONFIG_PATH, MIGRATION_CONFIG_PATH);
            console.log('migrateTdev.config.yaml created.');
        }
        process.exit(1);
    }
    const rawConfig = await fs.readFile(MIGRATION_CONFIG_PATH, 'utf8');
    const config = yamlLoad(rawConfig) as MigrationConfig;
    return config;
};

export default readOrCreateConfig;
