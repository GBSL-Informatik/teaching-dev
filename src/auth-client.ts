import { createAuthClient } from 'better-auth/react';
import { oneTimeTokenClient } from 'better-auth/client/plugins';
import siteConfig from '@generated/docusaurus.config';
interface AuthFields {
    BACKEND_URL: string;
}
export const { BACKEND_URL } = siteConfig.customFields as any as AuthFields;

export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: BACKEND_URL,
    plugins: [oneTimeTokenClient()]
});
