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
    presentationPanel,
    requestTarget,
    taskStateOverview
} from '../src/siteConfig/navbarItems';
import { themes as prismThemes } from 'prism-react-renderer';
import { brythonCodePluginConfig, yamlLoaderPluginConfig } from '../src/siteConfig/pluginConfigs';
import githubCmsPlugin from '../packages/hfr/github-cms/plugin';
import {
    recommendedBeforeDefaultRemarkPlugins,
    recommendedRehypePlugins,
    recommendedRemarkPlugins
} from '../src/siteConfig/markdownPluginConfigs';

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
        showEditThisPageOptions: ['github', 'github-dev', 'cms'],
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
            presentationPanel,
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
            },
            loggedOutOverlay: {
                persistChoiceTo: 'localStorage',
                // disable for netlify previews and for local development.
                disable: process.env.NODE_ENV !== 'production' || !!process.env.NETLIFY
            }
        },
        plugins: [
            brythonCodePluginConfig(),
            yamlLoaderPluginConfig,
            githubCmsPlugin({
                pages: {},
                remarkPlugins: recommendedRemarkPlugins,
                rehypePlugins: recommendedRehypePlugins,
                beforeDefaultRemarkPlugins: recommendedBeforeDefaultRemarkPlugins
            })
        ],
        dynamicRoutes: [
            {
                path: '/cms/',
                component: '@hfr/github-cms/components'
            }
        ],
        apiDocumentProviders: [
            require.resolve('@tdev/netpbm-graphic/register'),
            require.resolve('@tdev/text-message/register'),
            require.resolve('@tdev/pyodide-code/register'),
            require.resolve('@tdev/brython-code/register'),
            require.resolve('@tdev/page-read-check/register'),
            require.resolve('@tdev/webserial/register'),
            require.resolve('@hfr/github-cms/register')
        ]
    };
};

export default getSiteConfig;
