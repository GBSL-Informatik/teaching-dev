// This file is used to configure the teaching-dev page.

import { SiteConfigProvider } from '@tdev/siteConfig/siteConfig';

const getSiteConfig: SiteConfigProvider = () => {
    return {
        title: 'Teaching Dev',
        gitHub: {
            orgName: 'gbsl-informatik',
            projectName: 'teaching-dev'
        },
        tagline: 'Eine Plattform zur Gestaltung interaktiver Lernerlebnisse',
        favicon: 'img/favicon.ico',
        url: 'https://teaching-dev.gbsl.website',
        baseUrl: '/',
        docs: {
            path: 'tdev-website/docs'
        },
        blog: {
            path: 'tdev-website/blog'
        },
        onBrokenLinks: 'throw',
        tdevConfig: {
            excalidraw: {
                imageMarkupEditor: true,
                excalidoc: true
            }
        },
        apiDocumentProviders: [
            require.resolve('@tdev/netpbm-graphic/register'),
            require.resolve('@tdev/text-message/register')
        ]
    };
};

export default getSiteConfig;
