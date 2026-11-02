import { debounce } from 'es-toolkit/compat';
import fs from 'fs/promises';
import { load as yamlLoad } from 'js-yaml';
import path from 'path';

interface TdevPackageConfig {
    path: string;
    docs: {
        org: string;
        package: string;
        path: string;
        include?: string[];
        exclude?: string[];
    };
}

const TDEV_PACKAGE_CONFIG_YML = 'tdevPackage.config.yml' as const;
const DEFAULT_DOCS_CONFIG: Omit<TdevPackageConfig['docs'], 'org' | 'package'> = {
    path: 'docs'
};
const CWD = process.cwd();

const DEFAULT_README_CONFIG: Omit<TdevPackageConfig['docs'], 'org' | 'package'> = {
    path: '.',
    include: [
        'README.md',
        'README.mdx',
        '_category_.yml',
        '_category_.json',
        'assets/',
        'images/',
        'img/',
        'assets/**',
        'images/**',
        'img/**'
    ]
};

interface PackageInfo {
    packageDir: string;
    org: string;
    package: string;
    relativeSubPath?: string;
}

const resolveDir = (pkgPath: string, ...parts: string[]): string => {
    if (pkgPath.startsWith(CWD)) {
        return path.resolve(pkgPath, ...parts);
    }
    return path.resolve(CWD, pkgPath, ...parts);
};

const CATEGORY_MATCHER = /^_category_\.(json|ya?ml)$/;
export const categoryFileLocation = (filePath: string, packageDir: string): string | null => {
    if (!filePath.startsWith(packageDir)) {
        return null;
    }
    const relPath = path.relative(packageDir, filePath);
    const parts = relPath.split(path.sep);
    if (parts.length === 1 && CATEGORY_MATCHER.test(parts[0])) {
        return '';
    }
    if (parts.length === 2 && CATEGORY_MATCHER.test(parts[1])) {
        return parts[0];
    }
    return null;
};

export const packageInfo = (filePath: string, packageDir: string): PackageInfo | null => {
    if (!filePath.startsWith(packageDir)) {
        return null;
    }
    const relPath = path.relative(packageDir, filePath);
    const parts = relPath.split(path.sep);
    if (parts.length < 3) {
        return null;
    }
    const pkgInfo: PackageInfo = {
        packageDir,
        org: parts[0],
        package: parts[1]
    };
    const relativeSubPath = parts.slice(2).join(path.sep);
    if (relativeSubPath.length > 0) {
        pkgInfo.relativeSubPath = relativeSubPath;
    }
    return pkgInfo;
};

export const syncCategoryFile = async (srcFolder: string, destFolder: string) => {
    for (const ext of ['.json', '.yaml', '.yml']) {
        const categoryFileSrc = path.join(srcFolder, `_category_${ext}`);
        try {
            const stat = await fs.stat(categoryFileSrc);
            if (stat.isFile()) {
                const categoryFileDest = path.join(destFolder, `_category_${ext}`);
                await fs.mkdir(path.dirname(categoryFileDest), { recursive: true });
                await fs.copyFile(categoryFileSrc, categoryFileDest);
                return `✅ Copied ${destFolder}/_category_${ext}.`;
            }
        } catch {}
    }
    return null;
};

export const syncDocsFolder = async (pkgConfig: TdevPackageConfig, packageDocsDir: string) => {
    const { org, package: packageName, path: docsPath } = pkgConfig.docs;
    const srcPath = resolveDir(pkgConfig.path, docsPath);
    const destPackagePath = resolveDir(packageDocsDir, org, packageName);
    await fs.mkdir(destPackagePath, { recursive: true });
    const rsyncArgs = ['-avq', '--delete', '--chmod=Fa-w'];
    if (pkgConfig.docs.include && pkgConfig.docs.include.length > 0) {
        pkgConfig.docs.include.forEach((inc) => {
            rsyncArgs.push('--include', inc);
        });
        rsyncArgs.push('--exclude', '*');
    }
    if (pkgConfig.docs.exclude && pkgConfig.docs.exclude.length > 0) {
        pkgConfig.docs.exclude.forEach((exc) => {
            rsyncArgs.push('--exclude', exc);
        });
    }
    rsyncArgs.push(`${srcPath}/`, destPackagePath);
    const { spawn } = await import('child_process');
    return new Promise<string>((resolve, reject) => {
        const rsync = spawn('rsync', rsyncArgs, { stdio: 'inherit' });
        rsync.on('close', (code) => {
            if (code === 0 || code === 23) {
                resolve(`✅ ${pkgConfig.docs.org}/${pkgConfig.docs.package} docs synced.`);
            } else {
                console.error(`rsync failed with exit code ${code}`);
                reject(new Error(`rsync process exited with code ${code}`));
            }
        });
    });
};

const getPackageDocsConfig = async (
    packagesDir: string,
    orgName: string,
    packageName: string
): Promise<TdevPackageConfig | null> => {
    const packagePath = path.join(packagesDir, orgName, packageName);

    // Heuristic 1: tdevPackage.config.yml
    const configYml = path.join(packagePath, TDEV_PACKAGE_CONFIG_YML);
    try {
        await fs.access(configYml);
        const raw = await fs.readFile(configYml, 'utf8');
        const config: any = yamlLoad(raw) || {};
        return {
            path: packagePath,
            docs: {
                org: orgName,
                package: packageName,
                ...config.docs
            }
        };
    } catch {}

    // Heuristic 2: docs folder
    const docsDir = path.join(packagePath, 'docs');
    try {
        const stat = await fs.stat(docsDir);
        if (stat.isDirectory()) {
            return {
                path: packagePath,
                docs: {
                    ...DEFAULT_DOCS_CONFIG,
                    org: orgName,
                    package: packageName
                }
            };
        }
    } catch {}

    // Heuristic 3: README.mdx? at root
    for (const file of ['README.mdx', 'README.md']) {
        const readmePath = path.join(packagePath, file);
        try {
            const stat = await fs.stat(readmePath);
            if (stat.isFile()) {
                return {
                    path: packagePath,
                    docs: {
                        ...DEFAULT_README_CONFIG,
                        org: orgName,
                        package: packageName
                    }
                };
            }
        } catch {}
    }
    return null;
};

export const getPackageDocsConfigs = async (packagesDir: string): Promise<TdevPackageConfig[]> => {
    const orgDirs = await fs.readdir(packagesDir, { withFileTypes: true });
    const allConfigs: TdevPackageConfig[] = [];

    for (const orgDir of orgDirs) {
        if (!orgDir.isDirectory()) {
            continue;
        }
        const orgPath = path.join(packagesDir, orgDir.name);
        const packageDirs = await fs.readdir(orgPath, { withFileTypes: true });

        for (const packageDirEnt of packageDirs) {
            if (!packageDirEnt.isDirectory()) {
                continue;
            }
            const pkgConfig = await getPackageDocsConfig(packagesDir, orgDir.name, packageDirEnt.name);
            if (pkgConfig) {
                allConfigs.push(pkgConfig);
            }
        }
    }

    return allConfigs;
};

export const getDebouncedSyncer = async (
    packageDir: string,
    destDir: string,
    afterSync?: () => Promise<void>
) => {
    const syncQueue = new Set<PackageInfo>();
    let pendingSync = Promise.resolve();
    const syncDebounced = debounce(() => {
        const packages = new Map<string, PackageInfo>();
        for (const pkgInfo of syncQueue) {
            packages.set(`${pkgInfo.org}/${pkgInfo.package}`, pkgInfo);
        }
        syncQueue.clear();
        // Package copies delete extra files, so extension docs must follow them in the same queue.
        pendingSync = pendingSync
            .then(async () => {
                for (const pkgInfo of packages.values()) {
                    const config = await getPackageDocsConfig(packageDir, pkgInfo.org, pkgInfo.package);
                    if (config) {
                        console.log(await syncDocsFolder(config, destDir));
                    } else {
                        await fs.rm(path.join(destDir, pkgInfo.org, pkgInfo.package), {
                            recursive: true,
                            force: true
                        });
                    }
                }
                await afterSync?.();
            })
            .catch((error) => {
                console.error('Error synchronizing package documentation:', error);
            });
        return pendingSync;
    }, 300);
    return { syncQueue, syncDebounced };
};
