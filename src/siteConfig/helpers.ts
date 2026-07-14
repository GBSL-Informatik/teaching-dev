import { createFileSync, readdirSync } from 'fs-extra';
import { SiteConfig } from './siteConfig';
import path from 'path';
const CWD = process.cwd();
export const DEFAULT_TDEV_NAME = 'tdev';
const DEFAULT_FILE_NAME = {
    blog: `${new Date().toISOString().split('T')[0]}-blog.mdx`,
    docs: 'index.mdx'
};

export const getDirContent = (dir: string) => {
    try {
        return readdirSync(dir);
    } catch (e) {
        return [];
    }
};
export const useTdevContentPath = (siteConfig: SiteConfig, type: 'blog' | 'docs') => {
    const config = type in siteConfig ? siteConfig[type] : undefined;
    if (config === false) {
        return null;
    }
    if (config?.path) {
        return config.path;
    }
    const entries = getDirContent(path.join(CWD, type));
    if (config && Array.isArray(config.exclude) && config.exclude.includes(`${DEFAULT_TDEV_NAME}/**`)) {
        if (entries.length === 0 || entries[0] === DEFAULT_TDEV_NAME) {
            const fPath = path.join(CWD, type, DEFAULT_FILE_NAME[type]);
            console.log('Creating default tdev file', fPath);
            createFileSync(fPath);
        }
        return type;
    }
    if (entries.length === 0) {
        return null;
    }
    if (entries.length === 1 && entries[0] === DEFAULT_TDEV_NAME) {
        return `${type}/${DEFAULT_TDEV_NAME}`;
    }
    return type;
};
