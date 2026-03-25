import dynamicRouterPlugin, { Config as DynamicRouteConfig } from '../plugins/plugin-dynamic-routes';
import aliasConfigurationPlugin from '../plugins/plugin-alias-configuration';
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

export const brythonCodePluginConfig: () => PluginConfig = () => [
    require.resolve('@tdev/brython-code/plugin'),
    {
        brythonSrc: 'https://cdn.jsdelivr.net/npm/brython@3.13.2/brython.min.js',
        brythonStdlibSrc: 'https://cdn.jsdelivr.net/npm/brython@3.13.2/brython_stdlib.js',
        libDir: '/bry-libs/'
    }
];

export { aliasConfigurationPlugin };

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
                        project: SENTRY_PROJECT,
                        sourcemaps: {
                            // As you're enabling client source maps, you probably want to delete them after they're uploaded to Sentry.
                            // Set the appropriate glob pattern for your output folder - some glob examples below:
                            filesToDeleteAfterUpload: ['./**/*.map', './build/**/*.map']
                        },
                        telemetry: false,
                        silent: true
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
