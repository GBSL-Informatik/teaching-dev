import siteConfig from '@generated/docusaurus.config';
import { TdevCustomFields } from '@tdev/siteConfig/TdevCustomFields';

const customFields = (siteConfig.customFields ?? {}) as unknown as TdevCustomFields;

export default customFields;
