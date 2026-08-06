import fs from 'node:fs/promises';
import path from 'node:path';
import { MigrationRunner as ActionRunner, ACTIONS_PATH } from '../constants.js';

interface Action {
    path: string;
    actionName: string;
    runner: ActionRunner;
}

export async function loadActionRunner(action: string): Promise<Action> {
    const actionFiles = await fs.readdir(ACTIONS_PATH);
    const actions = actionFiles.filter((file) => file.endsWith('.ts') && file.includes(action));
    if (actions.length === 0) {
        console.warn(`No action files found for action: ${action}`);
        process.exit(0);
    }
    if (actions.length > 1) {
        console.warn(
            `Multiple action files found for action: ${action} - specify the action more precisely.\nFound:\n  - ${actions.join('\n  - ')}`
        );
        process.exit(0);
    }
    const file = actions[0];
    const filePath = path.join(ACTIONS_PATH, file);
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
        console.warn(`File is not a regular file: ${filePath}`);
        process.exit(0);
    }

    const actionModule = await import(filePath);
    if (typeof actionModule.default === 'function') {
        return {
            path: filePath,
            actionName: path.basename(filePath, '.ts'),
            runner: actionModule.default as ActionRunner
        };
    }

    console.warn(`Action file ${filePath} does not have a default export function.`);
    process.exit(0);
}
