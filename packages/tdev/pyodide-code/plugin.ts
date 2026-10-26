import type { Plugin } from '@docusaurus/types';
import type { Chunk, Configuration, OptimizationSplitChunksOptions } from '@rspack/core';
import { PYODIDE_VERSION } from './config';

const excludePyodideWorker =
    (configuredChunks?: OptimizationSplitChunksOptions['chunks']) => (chunk: Chunk) => {
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

const pyodidePlugin: Plugin = () => {
    if (!/^\d+\.\d+\.\d+$/.test(PYODIDE_VERSION)) {
        throw new Error(
            'Pin the pyodide dependency to an exact stable version in pyodide-code/package.json.'
        );
    }

    return {
        name: 'pyodide-code',
        configureWebpack(config: Configuration, isServer: boolean): Configuration {
            if (isServer) {
                return {};
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
