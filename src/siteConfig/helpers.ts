import { createFileSync, readdirSync } from 'fs-extra';
import { SiteConfig } from './siteConfig';
import path from 'path';
import { loadMaterialConfig, normalizeMaterialConfig } from '@tdev/material-sync/src/helpers';
import { type EditUrlFunction } from '@docusaurus/plugin-content-docs';
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

const ensureLeadingSlash = (str: string) => {
    return str.startsWith('/') ? str : `/${str}`;
};

export const resolveEditUrl = () => {
    const matrialConfig = normalizeMaterialConfig(loadMaterialConfig(true));
    const getEditUrl = (props: Omit<Parameters<EditUrlFunction>[0], 'locale' | 'permalink'>) => {
        const { version, docPath, versionDocsDirPath } = props;
        if (version === 'current') {
            return ensureLeadingSlash(`${versionDocsDirPath}/${docPath}`);
        }
        if (!(version in matrialConfig)) {
            return ensureLeadingSlash(`${versionDocsDirPath}/${docPath}`);
        }
        const config = matrialConfig[version as keyof typeof matrialConfig] ?? [];
        const docParts = docPath.split('/');
        const relativeTo = (to: string) => {
            if (to.startsWith(versionDocsDirPath)) {
                return to.slice(versionDocsDirPath.length + 1);
            }
            if (to.startsWith('/' + versionDocsDirPath)) {
                return to.slice(versionDocsDirPath.length + 2);
            }
            return to;
        };
        const resolveSourceFilePath = (parts: string[]) => {
            if (parts.length === 0) {
                return `${versionDocsDirPath}/${docPath}`;
            }
            const absPath = parts.join('/');
            const item = config.find(({ to }) => relativeTo(to) === absPath);
            if (item) {
                const resolvedPath = path.join(item.from, ...docParts.slice(parts.length));
                if (item.ignore?.some((ignore) => resolvedPath.startsWith(path.join(item.from, ignore)))) {
                    return `${versionDocsDirPath}/${docPath}`;
                }
                return resolvedPath;
            }
            return resolveSourceFilePath(parts.slice(0, -1));
        };
        const sourceFilePath = resolveSourceFilePath(docParts);
        return ensureLeadingSlash(sourceFilePath);
    };
    return getEditUrl;
};
