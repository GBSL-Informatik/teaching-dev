import type { PluginConfig } from '@docusaurus/types';
import path from 'path';

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
