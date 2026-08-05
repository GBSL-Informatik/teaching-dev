import fs from 'node:fs/promises';
import { load as yamlLoad } from 'js-yaml';
import { pathExists } from './base.js';
import { MIGRATION_CONFIG_PATH } from '../constants.js';
import shellInput from './shellInput.js';

export interface MigrationConfig {
    tdevPages: {
        path: string;
        apiMode: 'api' | 'indexedDb' | 'memory';
        managed: 'fully' | 'partially' | 'none';
    }[];
}

const readOrCreateMigrationConfig = async (): Promise<MigrationConfig> => {
    const configExists = await pathExists(MIGRATION_CONFIG_PATH);
    if (!configExists) {
        const answer = await shellInput(
            `migrateTdev.config.yaml does not exist. Do you want to create it? [y/n]`
        );
        if (answer.trim().toLowerCase() === 'y') {
            console.log('Creating migrateTdev.config.yaml...');
            await fs.writeFile(MIGRATION_CONFIG_PATH, 'tdevPages: []\n', 'utf8');
            console.log(`${MIGRATION_CONFIG_PATH} created.`);
        }
        process.exit(1);
    }
    const rawConfig = await fs.readFile(MIGRATION_CONFIG_PATH, 'utf8');
    const config = yamlLoad(rawConfig) as MigrationConfig;
    return config;
};

export default readOrCreateMigrationConfig;
