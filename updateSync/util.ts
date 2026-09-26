import * as os from 'os';
import * as path from 'path';

export function expandTilde(filePath: string): string {
    if (filePath[0] === '~') {
        return path.join(os.homedir(), filePath.slice(1));
    }
    return filePath;
}
