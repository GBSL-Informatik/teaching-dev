import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT } from './helpers/base.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const MIGRATION_CONFIG_NAME = 'migrateTdev.config.yaml';
export const MIGRATION_CONFIG_PATH = path.join(REPO_ROOT, MIGRATION_CONFIG_NAME);

export const MIGRATION_DEFAULT_CONFIG_NAME = 'migrateTdev.default.yaml';
export const MIGRATION_DEFAULT_CONFIG_PATH = path.join(__dirname, MIGRATION_DEFAULT_CONFIG_NAME);

export const MIGRATION_PATH = path.join(__dirname, '..', 'migrations');
export const ACTIONS_PATH = path.join(__dirname, '..', 'actions');

export type MigrationRunner = (
    projectRoot: string,
    migrationName: string,
    timestamp: number,
    config: {
        apiMode: 'api' | 'indexedDb' | 'memory';
        managed: 'fully' | 'partially' | 'none';
    }
) => Promise<void>;
