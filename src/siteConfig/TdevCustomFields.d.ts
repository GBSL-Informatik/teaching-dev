import { EditThisPageOption, ShowEditThisPage, TdevConfig } from './siteConfig';

export interface TdevCustomFields {
    /** Use test user in local dev: set DEFAULT_TEST_USER to the default test users email adress*/
    TEST_USER?: string;
    OFFLINE_API: 'indexedDB' | boolean;
    NO_AUTH: boolean;
    /** The Domain Name of this app */
    APP_URL?: string;
    /** The Domain Name where the api is running */
    BACKEND_URL: string;
    GIT_COMMIT_SHA: string;
    SENTRY_DSN?: string;
    GH_OAUTH_CLIENT_ID?: string;
    PERSONAL_SPACE_DOC_ROOT_ID: string;
    showEditThisPage: ShowEditThisPage;
    showEditThisPageOptions: EditThisPageOption[];
    editThisPageCmsUrl: string;
    tdevConfig: Partial<TdevConfig>;

    // legacy?
    DOCS_ONLY?: boolean;
}
