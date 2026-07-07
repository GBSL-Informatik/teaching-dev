import siteConfig from '@generated/docusaurus.config';
import customFields from '@tdev-components/utils/customFields';
const { BACKEND_URL, OFFLINE_API } = customFields;
const DB_NAME = `${siteConfig.organizationName ?? 'gbsl'}-${siteConfig.projectName ?? 'tdev'}-db${process.env.NODE_ENV === 'production' ? '' : '-dev'}`;

export { BACKEND_URL, OFFLINE_API, DB_NAME };
