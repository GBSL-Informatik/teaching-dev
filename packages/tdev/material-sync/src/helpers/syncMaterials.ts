import fs from 'node:fs/promises';
import path from 'node:path';
import Rsync from 'rsync';
import {
    ConfigType,
    ensureStartingSlash,
    ensureSync,
    ensureTrailingSlash,
    NormalizedConfig,
    pathExists,
    resolveMaterialConfig,
    SyncConfig
} from './index.js';

interface SyncOptions {
    /** set when docs/ was moved to _docs/ (WITHOUT_DOCS) */
    withoutDocs?: boolean;
}

/**
 * Sync all configured materials into their classes. Paths are resolved relative to the cwd.
 */
export const syncMaterials = async (config: ConfigType, options: SyncOptions = {}): Promise<void> => {
    for (const klass of Object.keys(config)) {
        await syncClass(klass, config[klass], options);
    }
};

const syncClass = async (klass: string, configs: SyncConfig[], options: SyncOptions): Promise<void> => {
    const gitignore: string[] = [];
    const classDir = getClassDir(klass);
    for (const syncConfig of configs) {
        const config = resolveMaterialConfig(klass, syncConfig);
        const resolvedClassDir = classDir ?? config.to.split('/')[0] + '/';
        gitignore.push(...(await syncEntry(klass, config, resolvedClassDir, options)));
        await fs.writeFile(`${resolvedClassDir}.gitignore`, gitignore.join('\n'));
    }
};

const getClassDir = (klass: string): string | undefined => {
    if (klass === 'pages') {
        return 'website/pages/';
    }
    if (klass === 'docs') {
        return undefined;
    }
    return `versioned_docs/version-${klass}/`;
};

/**
 * @returns the .gitignore lines for the synced entry
 */
const syncEntry = async (
    klass: string,
    config: NormalizedConfig,
    classDir: string,
    options: SyncOptions
): Promise<string[]> => {
    const srcPath = options.withoutDocs && config.from.startsWith('docs/') ? `_${config.from}` : config.from;
    const isDir = (await fs.lstat(srcPath)).isDirectory();

    const destParent = path.dirname(config.to);
    await fs.mkdir(destParent, { recursive: true });

    const gitignore = isDir
        ? await syncDirectory(klass, config, ensureTrailingSlash(srcPath), classDir)
        : await copyFile(config, srcPath, classDir);

    if (config.open) {
        const folder = isDir ? config.to : destParent;
        gitignore.push(await writeOpenCategory(folder, classDir));
    }
    return gitignore;
};

const syncDirectory = async (
    klass: string,
    config: NormalizedConfig,
    srcPath: string,
    classDir: string
): Promise<string[]> => {
    const ignore = config.ignore || [];
    const sanitizedClassDir = ensureTrailingSlash(config.to.replace(classDir, ''));
    const gitignore = [`${sanitizedClassDir}*`];
    const rsync = new Rsync().flags('v').source(srcPath).destination(config.to).archive().delete();
    if (ignore.length > 0) {
        rsync.exclude(ignore.map((i) => ensureStartingSlash(i)));
        gitignore.push(...(await ignoredGitignoreLines(klass, srcPath, sanitizedClassDir, ignore)));
    }
    rsync.exclude(['.sync.*', '*.nosync', '*.nosync.*']);
    console.log('SYNC', config.to, srcPath);
    await ensureSync(rsync, srcPath);
    return gitignore;
};

/**
 * Ignored paths are not synced, so they must not be git-ignored in the destination either.
 */
const ignoredGitignoreLines = async (
    klass: string,
    srcPath: string,
    sanitizedClassDir: string,
    ignore: string[]
): Promise<string[]> => {
    const lines: string[] = [];
    for (const ifile of ignore) {
        const opath = `${srcPath}${ifile}`;
        const ipath = `${sanitizedClassDir}${ifile}`;
        if (!(await pathExists(opath))) {
            console.warn(`⚠️ [ignore] ${klass}->${srcPath}: ignored "${ifile}" does not exist`);
            continue;
        }
        const isDir = (await fs.lstat(opath)).isDirectory();
        lines.push(isDir ? `!${ensureTrailingSlash(ipath)}` : `!${ipath}`);
    }
    return lines;
};

const copyFile = async (config: NormalizedConfig, srcPath: string, classDir: string): Promise<string[]> => {
    await fs.copyFile(srcPath, config.to);
    return [config.to.replace(classDir, '')];
};

/**
 * Write a `_category_.json` that shows the folder expanded and marked in the sidebar.
 * @returns the .gitignore line for the category file
 */
const writeOpenCategory = async (folder: string, classDir: string): Promise<string> => {
    await fs.mkdir(folder, { recursive: true });
    const categoryPath = path.join(folder, '_category_.json');
    console.log('---------- CAT', categoryPath);
    const existing = (await pathExists(categoryPath))
        ? JSON.parse(await fs.readFile(categoryPath, 'utf-8'))
        : {};
    const category = {
        ...existing,
        collapsible: true,
        collapsed: false,
        className: 'library-item marked'
    };
    await fs.writeFile(categoryPath, JSON.stringify(category, undefined, 2) + '\n');
    return categoryPath.replace(classDir, '');
};
