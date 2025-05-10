import path from 'path';
import dynamicRouterPlugin, { Config as DynamicRouteConfig } from '../plugins/plugin-dynamic-routes';
import type { CurrentBundler, PluginConfig } from '@docusaurus/types';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { sentryWebpackPlugin } from '@sentry/webpack-plugin';

const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'));

const pdfjs_cMapsDir = path.join(pdfjsDistPath, 'cmaps');

const getCopyPlugin = (currentBundler: CurrentBundler): typeof CopyWebpackPlugin => {
    if (currentBundler.name === 'rspack') {
        // @ts-expect-error: this exists only in Rspack
        return currentBundler.instance.CopyRspackPlugin;
    }
    return CopyWebpackPlugin;
};

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
                        '@tdev': [path.resolve(cwd, './website'), path.resolve(cwd, './src')],
                        /** original tdev source */
                        '@tdev-original': [path.resolve(cwd, './src')]
                    }
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
        console.warn(
            'Sentry is not configured. Please set SENTRY_AUTH_TOKEN, SENTRY_ORG and SENTRY_PROJECT in your environment variables.'
        );
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

export const pdfjsCopyDependenciesPluginConfig: PluginConfig = () => {
    return {
        name: 'pdfjs-copy-dependencies',
        configureWebpack(config, isServer, { currentBundler }) {
            const Plugin = getCopyPlugin(currentBundler);
            return {
                resolve: {
                    alias: {
                        canvas: false
                    }
                },
                plugins: [
                    new Plugin({
                        patterns: [
                            {
                                from: pdfjs_cMapsDir,
                                to: 'cmaps/'
                            }
                        ]
                    })
                ]
            };
        }
    };
};

export const excalidrawPluginConfig: PluginConfig = () => {
    return {
        name: 'excalidraw-config',
        configureWebpack(config, isServer, { currentBundler }) {
            const cwd = process.cwd();
            return {
                module: {
                    rules: [
                        {
                            test: /\.excalidraw$/,
                            type: 'json'
                        },
                        {
                            test: /\.excalidrawlib$/,
                            type: 'json'
                        }
                    ]
                },
                resolve: {
                    fallback: {
                        'roughjs/bin/math': path.resolve(cwd, './node_modules/roughjs/bin/math.js'),
                        'roughjs/bin/rough': path.resolve(cwd, './node_modules/roughjs/bin/rough.js'),
                        'roughjs/bin/generator': path.resolve(cwd, './node_modules/roughjs/bin/generator.js')
                    }
                },
                plugins: [
                    new currentBundler.instance.DefinePlugin({
                        'process.env.IS_PREACT': JSON.stringify('false')
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
