import fs from 'node:fs/promises';
import path from 'node:path';
import Rsync from 'rsync';
import { REPO_ROOT, PACKAGE_ROOT, pathExistsSync } from '../helpers.js';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.chdir(REPO_ROOT);

const main = async (): Promise<void> => {
    console.log('Migrating...');

    const migrateConfigPath = path.join(REPO_ROOT, 'migrateTdev.config.yaml');
    const configExists = await pathExistsSync(migrateConfigPath);
    if (!configExists) {
        console.log('migrateTdev.config.yaml does not exist. Do you want to create it? [y/n]');
        const answer = await new Promise<string>((resolve) => {
            process.stdin.once('data', (data) => {
                resolve(data.toString().trim());
            });
        });
        if (answer.toLowerCase() === 'y') {
            console.log('Creating migrateTdev.config.yaml...');
            const defaultConfig = path.join(__dirname, 'migrateTdev.default.yaml');
            await fs.copyFile(defaultConfig, migrateConfigPath);
            console.log('migrateTdev.config.yaml created.');
        }
        console.log('Aborting migration.');
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
