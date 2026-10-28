import type { LoadContext, Plugin } from '@docusaurus/types';
import type { Chunk, Configuration } from 'webpack';
import { PYODIDE_VERSION } from './config';
import { createRegistrySource, resolveExtensions, type PluginOptions } from './extensions/config';

export type { ExtensionConfig, PluginOptions } from './extensions/config';

type SplitChunksOptions = Exclude<
    NonNullable<Configuration['optimization']>['splitChunks'],
    false | undefined
>;

const excludePyodideWorker = (configuredChunks?: SplitChunksOptions['chunks']) => (chunk: Chunk) => {
    if (chunk.name === 'pyodide-worker') {
        return false;
    }
    if (typeof configuredChunks === 'function') {
        return configuredChunks(chunk);
    }
    if (configuredChunks instanceof RegExp) {
        return configuredChunks.test(chunk.name || '');
    }
    if (configuredChunks === 'all') {
        return true;
    }
    if (configuredChunks === 'initial') {
        return chunk.canBeInitial();
    }
    return !chunk.canBeInitial();
};

const pyodidePlugin = (context: LoadContext, options: PluginOptions = {}): Plugin => {
    if (!/^\d+\.\d+\.\d+$/.test(PYODIDE_VERSION)) {
        throw new Error(
            'Pin the pyodide dependency to an exact stable version in pyodide-code/package.json.'
        );
    }

    const extensions = resolveExtensions(context.siteDir, options);
    let registryAliases: Record<string, string> = {};

    return {
        name: 'pyodide-code',
        async contentLoaded({ actions }) {
            const worker = await actions.createData(
                'worker-extensions.js',
                createRegistrySource(extensions, 'worker')
            );
            const client = await actions.createData(
                'client-extensions.js',
                createRegistrySource(extensions, 'client')
            );
            registryAliases = {
                '@tdev-pyodide/worker-extensions$': worker,
                '@tdev-pyodide/client-extensions$': client
            };
        },
        configureWebpack(config: Configuration, isServer: boolean): Configuration {
            if (isServer) {
                return { resolve: { alias: registryAliases } };
            }
            const splitChunks = config.optimization?.splitChunks;
            const configuredChunks = splitChunks ? splitChunks.chunks : undefined;
            const cacheGroups = Object.fromEntries(
                Object.entries(splitChunks ? splitChunks.cacheGroups || {} : {}).map(([name, group]) => {
                    if (!group || typeof group !== 'object' || group instanceof RegExp || !group.chunks) {
                        return [name, group];
                    }
                    return [name, { ...group, chunks: excludePyodideWorker(group.chunks) }];
                })
            );

            return {
                resolve: { alias: registryAliases },
                module: {
                    parser: {
                        javascript: {
                            worker: ['...', 'ModuleWorker from @tdev/pyodide-code/workers/ModuleWorker']
                        }
                    }
                },
                optimization: {
                    splitChunks:
                        splitChunks === false
                            ? false
                            : {
                                  // Module workers cannot load shared chunks through importScripts().
                                  chunks: excludePyodideWorker(configuredChunks),
                                  cacheGroups,
                                  fallbackCacheGroup: {
                                      ...(splitChunks && splitChunks.fallbackCacheGroup),
                                      chunks: excludePyodideWorker(
                                          (splitChunks && splitChunks.fallbackCacheGroup?.chunks) ||
                                              configuredChunks
                                      )
                                  }
                              }
                }
            };
        }
    };
};

export default pyodidePlugin;
