import type { PluginConfig, PluginModule } from '@docusaurus/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { BinaryFiles } from '@excalidraw/excalidraw/types';
import Excalidoc from './model';
export interface ExcaliData {
    files: BinaryFiles;
    elements: readonly ExcalidrawElement[];
    image: string;
}

declare module '@tdev-api/document' {
    export interface TypeDataMapping {
        excalidoc: ExcaliData;
    }
    export interface TypeModelMapping {
        excalidoc: Excalidoc;
    }
}

export const excalidrawPluginConfig: PluginConfig = (() => {
    return {
        name: 'excalidraw-config',
        configureWebpack(config, isServer, { currentBundler }) {
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
                        },
                        {
                            // excalidraw imports e.g. 'roughjs/bin/rough' without file extension
                            test: /\.m?js$/,
                            include: /@excalidraw[\\/]excalidraw/,
                            resolve: { fullySpecified: false }
                        }
                    ]
                },
                plugins: [
                    new currentBundler.instance.DefinePlugin({
                        'process.env.IS_PREACT': JSON.stringify('false')
                    })
                ]
            };
        }
    };
}) satisfies PluginModule;
