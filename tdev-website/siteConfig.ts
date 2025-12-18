// This file is used to configure the teaching-dev page.

import { SiteConfigProvider } from '@tdev/siteConfig/siteConfig';
import {
    accountSwitcher,
    blog,
    cms,
    devModeAccessLocalFS,
    gallery,
    gitHub,
    loginProfileButton,
    personalSpaceOverlay,
    requestTarget,
    taskStateOverview
} from '../src/siteConfig/navbarItems';

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
        navbarItems: [
            gallery,
            blog,
            cms,
            gitHub,
            taskStateOverview,
            accountSwitcher,
            devModeAccessLocalFS,
            requestTarget,
            personalSpaceOverlay,
            loginProfileButton
        ],
        footer: {
            links: [
                {
                    title: 'Dokumentation',
                    items: [
                        {
                            label: 'Galerie',
                            to: '/docs/gallery'
                        }
                    ]
                },
                {
                    title: 'Mehr',
                    items: [
                        {
                            label: 'Blog',
                            to: '/blog'
                        }
                    ]
                }
            ]
        },
        onBrokenLinks: 'throw',
        tdevConfig: {
            excalidraw: {
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
