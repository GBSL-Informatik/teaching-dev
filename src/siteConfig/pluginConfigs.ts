import path from 'path';
import dynamicRouterPlugin, { Config as DynamicRouteConfig } from '../plugins/plugin-dynamic-routes';
import type { PluginConfig } from '@docusaurus/types';
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

export const aliasConfigurationPluginConfig: PluginConfig = () => {
    return {
        name: 'alias-configuration',
        getThemePath() {
            const cwd = process.cwd();
            const siteSrcPath = path.resolve(cwd, './website');
            return siteSrcPath;
        },
        configureWebpack(config, isServer, utils, content) {
            const cwd = process.cwd();
            return {
                resolve: {
                    alias: {
                        '@tdev-components': [
                            path.resolve(cwd, './website/components'),
                            path.resolve(cwd, './src/components')
                        ],
                        '@tdev-hooks': [
                            path.resolve(cwd, './website/hooks'),
                            path.resolve(cwd, './src/hooks')
                        ],
                        '@tdev-models': [
                            path.resolve(cwd, './website/models'),
                            path.resolve(cwd, './src/models')
                        ],
                        '@tdev-stores': [
                            path.resolve(cwd, './website/stores'),
                            path.resolve(cwd, './src/stores')
                        ],
                        '@tdev-api': [path.resolve(cwd, './website/api'), path.resolve(cwd, './src/api')],
                        '@tdev-plugins': [
                            path.resolve(cwd, './website/plugins'),
                            path.resolve(cwd, './src/plugins')
                        ],
                        '@tdev': [
                            path.resolve(cwd, './website'),
                            path.resolve(cwd, './src'),
                            path.resolve(cwd, './packages/tdev')
                        ],
                        /** original tdev source */
                        '@tdev-original': [path.resolve(cwd, './src'), path.resolve(cwd, './packages/tdev')]
                    },
                    // support's to resolve symlinks in monorepos
                    symlinks: false
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
