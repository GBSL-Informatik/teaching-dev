import { createAuthClient } from 'better-auth/react';
import { oneTimeTokenClient } from 'better-auth/client/plugins';
import siteConfig from '@generated/docusaurus.config';
interface AuthFields {
    APP_URL: string;
    BACKEND_URL: string;
    CLIENT_ID: string;
    TENANT_ID: string;
    API_URI: string;
}
export const { BACKEND_URL, CLIENT_ID, APP_URL, TENANT_ID, API_URI } =
    siteConfig.customFields as any as AuthFields;

export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: APP_URL,
    plugins: [oneTimeTokenClient()]
});
