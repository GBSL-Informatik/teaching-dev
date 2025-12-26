import { spawn } from 'child_process';
import path from 'path';
import fsSym from 'fs';
import fs from 'fs/promises';
import yaml from 'js-yaml';
import { debounce } from 'es-toolkit/compat';

interface TdevPackageConfig {
    path: string;
    docs?: Partial<{
        path: string;
        include: string[];
        exclude: string[];
    }>;
}

const DEFAULT_DOCS_CONFIG: Partial<TdevPackageConfig> = {
    docs: {
        path: 'docs'
    }
};

const DEFAULT_README_CONFIG: Partial<TdevPackageConfig> = {
    docs: {
        path: '.',
        include: ['_category_.yml', '_category_.json', 'assets/**', 'images/**', 'img/**']
    }
};

export const META_FILES_TEST = /_category_\.(yml|json)$/;

const getDocsRoot = (
    packageDir: string,
    destDir: string,
    filePath: string
): { src: string; dest: string } | null => {
    // filePath = ".../packages/<org>/<pkg>/docs/(...)?..."
    const parts = filePath.split(path.sep);
    console.log(parts);
    const docsIdx = parts.lastIndexOf('docs');
    if (META_FILES_TEST.test(filePath)) {
        if (fsSym.existsSync(filePath)) {
            return { src: filePath, dest: filePath.replace(packageDir, destDir) };
        }
    }
    if (docsIdx >= 2) {
        const org = parts[docsIdx - 2];
        const pkg = parts[docsIdx - 1];
        const docsSrc = path.join(packageDir, org, pkg, 'docs');
        const docsDest = path.join(destDir, org, pkg, 'docs');
        if (fsSym.existsSync(docsSrc) && fsSym.statSync(docsSrc).isDirectory()) {
            return { src: `${docsSrc}/`, dest: `${docsDest}/` };
        }
    }
    return null;
};

const syncDocsFolder = (src: string, dest: string) => {
    if (dest.endsWith(path.sep)) {
        fsSym.mkdirSync(dest, { recursive: true });
    }
    spawn('rsync', ['-av', '--delete', src, dest], { stdio: 'inherit' });
};
export const getPackageDocsConfig = async (packagesDir: string): Promise<TdevPackageConfig[]> => {
    const orgDirs = await fs.readdir(packagesDir, { withFileTypes: true });
    const allConfigs: TdevPackageConfig[] = [];

    for (const orgDir of orgDirs) {
        if (!orgDir.isDirectory()) continue;
        const orgPath = path.join(packagesDir, orgDir.name);
        const packageDirs = await fs.readdir(orgPath, { withFileTypes: true });

        for (const packageDirEnt of packageDirs) {
            if (!packageDirEnt.isDirectory()) continue;
            const packagePath = path.join(orgPath, packageDirEnt.name);

            // Heuristic 1: tdevPackage.config.yml
            const configYml = path.join(packagePath, 'tdevPackage.config.yml');
            try {
                await fs.access(configYml);
                const raw = await fs.readFile(configYml, 'utf8');
                const config: any = yaml.load(raw) || {};
                allConfigs.push({
                    path: packagePath,
                    ...config
                });
                continue;
            } catch {}

            // Heuristic 2: docs folder
            const docsDir = path.join(packagePath, 'docs');
            try {
                const stat = await fs.stat(docsDir);
                if (stat.isDirectory()) {
                    allConfigs.push({
                        path: packagePath,
                        ...DEFAULT_DOCS_CONFIG
                    });
                    continue;
                }
            } catch {}

            // Heuristic 3: README.mdx? at root
            for (const file of ['README.mdx', 'README.md']) {
                const readmePath = path.join(packagePath, file);
                try {
                    const stat = await fs.stat(readmePath);
                    if (stat.isFile()) {
                        allConfigs.push({
                            path: packagePath,
                            ...DEFAULT_README_CONFIG
                        });
                        break; // done for this package
                    }
                } catch {}
            }
        }
    }

    return allConfigs;
};

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
