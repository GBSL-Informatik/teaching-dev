import fs from 'node:fs/promises';
import path from 'node:path';
import { MIGRATION_PATH, MigrationRunner } from '../constants';

interface Migration {
    path: string;
    runner: MigrationRunner;
}

export async function* loadMigrationRunners(): AsyncGenerator<Migration> {
    const migrationFiles = await fs.readdir(MIGRATION_PATH);
    for (const file of migrationFiles) {
        const filePath = path.join(MIGRATION_PATH, file);
        const stat = await fs.stat(filePath);
        if (!stat.isFile()) {
            continue;
        }

        console.log(`Migrating file: ${filePath}`);
        if (!file.endsWith('.ts') || file.endsWith('.done.ts')) {
            console.warn(`Skipping non-JS/TS file: ${filePath}`);
            continue;
        }

        const migrationModule = await import(filePath);
        if (typeof migrationModule.default === 'function') {
            yield {
                path: filePath,
                runner: migrationModule.default as MigrationRunner
            };
            continue;
        }

        console.warn(`Migration file ${filePath} does not have a default export function.`);
    }
}
