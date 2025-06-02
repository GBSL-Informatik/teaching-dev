import type { CurrentBundler, PluginConfig } from '@docusaurus/types';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';

const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'));

const pdfjs_cMapsDir = path.join(pdfjsDistPath, 'cmaps');

const getCopyPlugin = (currentBundler: CurrentBundler): typeof CopyWebpackPlugin => {
    if (currentBundler.name === 'rspack') {
        // @ts-expect-error: this exists only in Rspack
        return currentBundler.instance.CopyRspackPlugin;
    }
    return CopyWebpackPlugin;
};

export const remarkPdfPluginConfig: PluginConfig = () => {
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
