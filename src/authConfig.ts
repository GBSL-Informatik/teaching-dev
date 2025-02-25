/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Configuration, LogLevel, type RedirectRequest } from '@azure/msal-browser';
import siteConfig from '@generated/docusaurus.config';

export interface CustomFields {
    APP_URL: string;
    BACKEND_URL: string;
    CLIENT_ID: string;
    TENANT_ID: string;
    API_URI: string;
}

/** The Domain Name of this app */
export const { BACKEND_URL, CLIENT_ID, APP_URL, TENANT_ID, API_URI } =
    siteConfig.customFields as any as CustomFields;

/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL.js configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md
 */
//cloudDiscoveryMetadata: '{"tenant_discovery_endpoint":"https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration","api-version":"1.1",
//"metadata":[{"preferred_network":"login.microsoftonline.com","preferred_cache":"login.windows.net","aliases":["login.microsoftonline.com","login.windows.net","login.microsoft.com","sts.windows.net"]},{"preferred_network":"login.partner.microsoftonline.cn","preferred_cache":"login.partner.microsoftonline.cn","aliases":["login.partner.microsoftonline.cn","login.chinacloudapi.cn"]},{"preferred_network":"login.microsoftonline.de","preferred_cache":"login.microsoftonline.de","aliases":["login.microsoftonline.de"]},{"preferred_network":"login.microsoftonline.us","preferred_cache":"login.microsoftonline.us","aliases":["login.microsoftonline.us","login.usgovcloudapi.net"]},{"preferred_network":"login-us.microsoftonline.com","preferred_cache":"login-us.microsoftonline.com","aliases":["login-us.microsoftonline.com"]}]}'

export const msalConfig: Configuration = {
    auth: {
        clientId: CLIENT_ID || 'nope',
        authority: `https://login.microsoftonline.com/${TENANT_ID}`,
        redirectUri: `${APP_URL}/user`,
        postLogoutRedirectUri: APP_URL
    },
    cache: {
        cacheLocation: 'localStorage', // This configures where your cache will be stored
        storeAuthStateInCookie: false // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        if (process.env.NODE_ENV !== 'debug') {
                            return;
                        }
                        console.info(message);
                        return;
                    case LogLevel.Verbose:
                        if (process.env.NODE_ENV !== 'debug') {
                            return;
                        }
                        console.debug(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                }
            }
        }
    }
};

export const scopes = [`${API_URI}/access_as_user`];

// Add here the endpoints and scopes for the web API you would like to use.
export const apiConfig = {
    uri: API_URI,
    scopes: scopes
};
/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 * For more information about OIDC scopes, visit:
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
 */
export const loginRequest = {
    scopes: scopes
};

/**
 * Scopes you add here will be used to request a token from Azure AD to be used for accessing a protected resource.
 * To learn more about how to work with scopes and resources, see:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md
 */
export const tokenRequest: RedirectRequest = {
    scopes: [...apiConfig.scopes]
};
