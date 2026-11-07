import { getCopyPlugin } from '@docusaurus/bundler';
import type { PluginConfig } from '@docusaurus/types';
import path from 'path';

const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'));

const pdfjs_cMapsDir = path.join(pdfjsDistPath, 'cmaps');

export const remarkPdfPluginConfig = (async (context) => {
    const CopyPlugin = await getCopyPlugin({ currentBundler: context.currentBundler });
    return {
        name: 'pdfjs-copy-dependencies',
        configureWebpack() {
            return {
                resolve: {
                    alias: {
                        canvas: false
                    }
                },
                plugins: [
                    new CopyPlugin({
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
}) satisfies PluginConfig;
