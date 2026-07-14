import { type EditUrlFunction } from '@docusaurus/plugin-content-docs';
import { loadMaterialConfig, normalizeMaterialConfig } from './index.js';
import path from 'path';

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
