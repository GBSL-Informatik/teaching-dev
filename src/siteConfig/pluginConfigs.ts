import path from 'path';
import dynamicRouterPlugin, { Config as DynamicRouteConfig } from '../plugins/plugin-dynamic-routes';
import type { LoadContext, Plugin, PluginConfig } from '@docusaurus/types';
import { sentryWebpackPlugin } from '@sentry/webpack-plugin';

// TODO: Consider bundling default / recommended plugins.

export const sassPluginConfig: PluginConfig = 'docusaurus-plugin-sass';

export const dynamicRouterPluginConfig: PluginConfig = [
    dynamicRouterPlugin,
    {
        routes: [
            {
                path: '/rooms/',
                component: '@tdev-components/Rooms'
            },
            {
                path: '/cms/',
                component: '@tdev-components/Cms'
            }
        ]
    } satisfies DynamicRouteConfig
];

export const rsDoctorPluginConfig: PluginConfig = process.env.RSDOCTOR === 'true' && [
    'rsdoctor',
    {
        rsdoctorOptions: {
            /* Options */
        }
    }
];

export const aliasConfigurationPluginConfig: Plugin = (
    context: LoadContext,
    options?: { websiteDir?: string }
) => {
    const websiteDir = options?.websiteDir ? options.websiteDir : './website';
    console.log('Using website directory for aliases:', websiteDir);
    return {
        name: 'alias-configuration',
        getThemePath() {
            const cwd = process.cwd();
            const siteSrcPath = path.resolve(cwd, websiteDir);
            return siteSrcPath;
        },
        configureWebpack() {
            const cwd = process.cwd();
            return {
                resolve: {
                    alias: {
                        '@tdev-components': [
                            path.resolve(cwd, websiteDir, './components'),
                            path.resolve(cwd, './src/components')
                        ],
                        '@tdev-hooks': [
                            path.resolve(cwd, websiteDir, './hooks'),
                            path.resolve(cwd, './src/hooks')
                        ],
                        '@tdev-models': [
                            path.resolve(cwd, websiteDir, './models'),
                            path.resolve(cwd, './src/models')
                        ],
                        '@tdev-stores': [
                            path.resolve(cwd, websiteDir, './stores'),
                            path.resolve(cwd, './src/stores')
                        ],
                        '@tdev-api': [path.resolve(cwd, websiteDir, './api'), path.resolve(cwd, './src/api')],
                        '@tdev-plugins': [
                            path.resolve(cwd, websiteDir, './plugins'),
                            path.resolve(cwd, './src/plugins')
                        ],
                        '@tdev': [
                            path.resolve(cwd, websiteDir),
                            path.resolve(cwd, websiteDir, './packages'),
                            path.resolve(cwd, './src'),
                            path.resolve(cwd, './packages/tdev')
                        ],
                        /** original tdev source */
                        '@tdev-original': [path.resolve(cwd, './src'), path.resolve(cwd, './packages/tdev')]
                    },
                    // "symlinks: false" would support to resolve symlinks in monorepos, but breaks yarn workspaces :/
                    symlinks: true
                },
                watchOptions: {
                    // ensure changes in symlinked packages are picked up on osx
                    followSymlinks: true
                },
                optimization: {
                    concatenateModules: false
                }
            };
        }
    };
};

export const sentryPluginConfig: PluginConfig = () => {
    const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
    const SENTRY_ORG = process.env.SENTRY_ORG;
    const SENTRY_PROJECT = process.env.SENTRY_PROJECT;
    if (!SENTRY_AUTH_TOKEN || !SENTRY_ORG || !SENTRY_PROJECT) {
        return { name: 'sentry-configuration' };
    }
    return {
        name: 'sentry-configuration',
        configureWebpack(config, isServer, utils, content) {
            return {
                devtool: 'source-map',
                plugins: [
                    sentryWebpackPlugin({
                        authToken: SENTRY_AUTH_TOKEN,
                        org: SENTRY_ORG,
                        project: SENTRY_PROJECT
                    })
                ]
            };
        }
    };
};

export const socketIoNoDepWarningsPluginConfig: PluginConfig = () => {
    return {
        name: 'socketio-no-dep-warnings',
        configureWebpack(config, isServer, { currentBundler }) {
            return {
                plugins: [
                    new currentBundler.instance.DefinePlugin({
                        'process.env.WS_NO_BUFFER_UTIL': JSON.stringify('true'),
                        'process.env.WS_NO_UTF_8_VALIDATE': JSON.stringify('true')
                    })
                ]
            };
        }
    };
};
