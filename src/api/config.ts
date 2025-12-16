import siteConfig from '@generated/docusaurus.config';
const { BACKEND_URL, OFFLINE_API } = siteConfig.customFields as {
    BACKEND_URL: string;
    OFFLINE_API?: boolean | 'memory' | 'indexedDB';
};
const DB_NAME = `${siteConfig.organizationName ?? 'gbsl'}-${siteConfig.projectName ?? 'tdev'}-db${process.env.NODE_ENV === 'production' ? '' : '-dev'}`;

export { BACKEND_URL, OFFLINE_API, DB_NAME };
