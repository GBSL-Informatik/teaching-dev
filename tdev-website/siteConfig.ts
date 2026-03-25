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
import { themes as prismThemes } from 'prism-react-renderer';
import { brythonCodePluginConfig } from '../src/siteConfig/pluginConfigs';

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
        websiteDir: 'tdev-website/website',
        docs: {
            path: 'tdev-website/docs'
        },
        blog: {
            path: 'tdev-website/blog'
        },
        pages: {
            path: 'tdev-website/pages'
        },
        themeConfig: {
            prism: {
                theme: prismThemes.github,
                darkTheme: prismThemes.dracula,
                additionalLanguages: ['bash', 'typescript', 'json', 'python', 'ruby']
            }
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
                },
                {
                    title: 'Tools',
                    items: [
                        {
                            label: 'Icon Selector',
                            to: '/mdi'
                        },
                        {
                            label: 'Excalidraw',
                            to: '/excalidraw'
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
        plugins: [brythonCodePluginConfig()],
        apiDocumentProviders: [
            require.resolve('@tdev/netpbm-graphic/register'),
            require.resolve('@tdev/text-message/register'),
            require.resolve('@tdev/pyodide-code/register'),
            require.resolve('@tdev/brython-code/register'),
            require.resolve('@tdev/page-read-check/register'),
            require.resolve('@tdev/webserial/register')
        ]
    };
};

export default getSiteConfig;
