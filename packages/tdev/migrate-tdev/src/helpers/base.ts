import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PACKAGE_ROOT = path.resolve(__dirname, '..');
export const REPO_ROOT = process.env.MATERIAL_CONFIG_PATH
    ? path.dirname(path.resolve(process.cwd(), process.env.MATERIAL_CONFIG_PATH))
    : path.resolve(__dirname, '..', '..', '..', '..', '..');
export const pathExists = async (p: string): Promise<boolean> => {
    try {
        await fsp.access(p);
        return true;
    } catch {
        return false;
    }
};
