import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { debounce } from 'es-toolkit/compat';

interface TdevPackageConfig {
    type: 'local' | 'git';
    docs?: Partial<{
        path: string;
        include: string[];
        exclude: string[];
    }>;
}

export const META_FILES_TEST = /_category_\.(yml|json)$/;
function getDocsRoot(
    packageDir: string,
    destDir: string,
    filePath: string
): { src: string; dest: string } | null {
    // filePath = ".../packages/<org>/<pkg>/docs/(...)?..."
    const parts = filePath.split(path.sep);
    console.log(parts);
    const docsIdx = parts.lastIndexOf('docs');
    if (META_FILES_TEST.test(filePath)) {
        if (fs.existsSync(filePath)) {
            return { src: filePath, dest: filePath.replace(packageDir, destDir) };
        }
    }
    if (docsIdx >= 2) {
        const org = parts[docsIdx - 2];
        const pkg = parts[docsIdx - 1];
        const docsSrc = path.join(packageDir, org, pkg, 'docs');
        const docsDest = path.join(destDir, org, pkg, 'docs');
        if (fs.existsSync(docsSrc) && fs.statSync(docsSrc).isDirectory()) {
            return { src: `${docsSrc}/`, dest: `${docsDest}/` };
        }
    }
    return null;
}

function syncDocsFolder(src: string, dest: string) {
    if (dest.endsWith(path.sep)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    spawn('rsync', ['-av', '--delete', src, dest], { stdio: 'inherit' });
}
export const getDebouncedSyncer = (packageDir: string, destDir: string) => {
    const syncQueue = new Set<string>();
    const syncDebounced = debounce(() => {
        for (const docsPath of syncQueue) {
            const info = getDocsRoot(packageDir, destDir, docsPath);
            if (info) {
                syncDocsFolder(info.src, info.dest);
            }
        }
        syncQueue.clear();
    }, 300);
    return { syncQueue, syncDebounced };
};
