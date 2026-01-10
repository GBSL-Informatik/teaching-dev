import path from 'path';
import fs from 'fs/promises';
import yaml from 'js-yaml';
import { debounce } from 'es-toolkit/compat';

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
            if (code === 0) {
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
        const config: any = yaml.load(raw) || {};
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

export const getDebouncedSyncer = async (packageDir: string, destDir: string) => {
    const syncQueue = new Set<PackageInfo>();
    const PackageConfigCache: Map<string, TdevPackageConfig> = new Map();
    getPackageDocsConfigs(packageDir).then((configs) => {
        for (const cfg of configs) {
            const pkgKey = `${cfg.docs.org}/${cfg.docs.package}`;
            PackageConfigCache.set(pkgKey, cfg);
        }
    });

    const setPackageConfig = async (pkgKey: string, newConfig?: TdevPackageConfig) => {
        if (!newConfig) {
            return false;
        }
        const prevConfig = PackageConfigCache.get(pkgKey);
        if (prevConfig) {
            const prevDocsPath = resolveDir(destDir, prevConfig.docs.org, prevConfig.docs.package);
            const currentDocsPath = resolveDir(destDir, newConfig.docs.org, newConfig.docs.package);
            if (prevDocsPath !== currentDocsPath) {
                fs.rm(prevDocsPath, { recursive: true, force: true }).catch(() => {});
            }
        }
        PackageConfigCache.set(pkgKey, newConfig);
        return true;
    };

    const syncDebounced = debounce(() => {
        const syncTasks: Promise<string>[] = [];
        for (const pkgInfo of syncQueue) {
            if (!pkgInfo) {
                continue;
            }
            const pkgKey = `${pkgInfo.org}/${pkgInfo.package}`;
            if (pkgInfo.relativeSubPath === TDEV_PACKAGE_CONFIG_YML) {
                const res = getPackageDocsConfig(packageDir, pkgInfo.org, pkgInfo.package).then(
                    (newConfig) => {
                        return setPackageConfig(pkgKey, newConfig).then((changed) => {
                            if (changed) {
                                return syncDocsFolder(newConfig, destDir);
                            }
                            return Promise.resolve(`ℹ️ ${pkgKey} docs config unchanged.`);
                        });
                    }
                );
                syncTasks.push(res);
            } else {
                const pkgConfig = PackageConfigCache.get(pkgKey);
                if (pkgConfig) {
                    syncTasks.push(syncDocsFolder(pkgConfig, destDir));
                }
            }
        }
        syncQueue.clear();
        return Promise.all(syncTasks).then((res) => {
            console.log(res.join('\n'));
            return res;
        });
    }, 300);
    return { syncQueue, syncDebounced };
};
