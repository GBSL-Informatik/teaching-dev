import { promises as fs } from 'fs';
import { dirname, sep, normalize } from 'path';

/**
 * Ensures that the directory for the given path exists.
 * If the path is already a directory, ensures that directory exists.
 * If the path is a file, ensures that the parent directory exists.
 *
 * @example
 * ```ts
 * await ensureDir('/path/to/some/directory/');
 * await ensureDir('/path/to/some/file.txt');
 * ```
 */
export const ensureDir = async (maybeDirOrFilePath: string) => {
    const norm = normalize(maybeDirOrFilePath);
    let dir: string;
    if (norm.endsWith(sep)) {
        dir = norm;
    } else {
        dir = dirname(norm);
    }
    await fs.mkdir(dir, { recursive: true });
};
