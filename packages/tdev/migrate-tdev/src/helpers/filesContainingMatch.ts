import { execa } from 'execa';
import path from 'node:path';

export const filesContainingMatch = async (root: string, match: string): Promise<string[]> => {
    try {
        const { stdout } = await execa`git grep -l ${match}`;
        if (stdout.trim() === '') {
            return [];
        }
        return stdout
            .split('\n')
            .filter((file) => file.trim() !== '')
            .filter((file) => !file.startsWith('packages/tdev/migrate-tdev'))
            .map((f) => path.join(root, f));
    } catch (error) {
        if (error instanceof Error && error.message.includes('exit code 1')) {
            // No matches found
            return [];
        }
        throw error;
    }
};
