/**
 * Notes
 * - how to add static files: https://github.com/facebook/docusaurus/discussions/6907
 *  ---> sitemap plugin: https://github.com/facebook/docusaurus/blob/main/packages/docusaurus-plugin-sitemap/src/index.ts
 * - call brython with arguments: https://github.com/brython-dev/brython/issues/2421
 *
 */

import type { HtmlTags, LoadContext, Plugin } from '@docusaurus/types';
// eslint-disable-next-line import/no-extraneous-dependencies, import/order
import fs from 'fs-extra';
import path from 'path';
import { type ThemeOptions, type Options, DEFAULT_OPTIONS } from './options';

export const NAME = 'live-editor-theme' as const;

const extractImports = (script: string): string[] => {
    const imports: string[] = [];
    script.split('\n').forEach((line) => {
        const fromImport = line.match(/from\s+(\w+)\s+import\s+/);
        if (fromImport) {
            return imports.push(fromImport[1]);
        }
        const importImport = line.match(/import\s+(\w+)/);
        if (importImport) {
            return imports.push(importImport[1]);
        }
    });
    return imports;
};

const prepareLibDir = (libDir: string) => {
    const isRemote = /https?:\/\//.test(libDir);
    if (isRemote) {
        return libDir;
    }
    return path.join('/', libDir, '/');
};

const theme: Plugin<{ remoteHeadTags: HtmlTags[] }> = (context: LoadContext, options: ThemeOptions) => {
    const libDir = prepareLibDir(options.libDir || DEFAULT_OPTIONS.libDir);
    const isRemote = /https?:\/\//.test(libDir);
    const isHashRouter = context.siteConfig.future?.experimental_router === 'hash';
    return {
        name: NAME,
        async loadContent() {
            const staticDir = path.join(context.siteDir, context.siteConfig.staticDirectories[0], libDir);
            const bryModules: { name: string; content: string }[] = [];
            if (isHashRouter && !isRemote) {
                const libs = await fs.readdir(staticDir);
                const libraries: { [key: string]: string } = {};
                for (const lib of libs) {
                    const libPath = path.join(staticDir, lib);
                    if (libPath.endsWith('.py')) {
                        const libContent = await fs.readFile(libPath, 'utf-8');
                        libraries[lib.replace(/\.py$/i, '')] = libContent;
                    }
                }
                const libNames = Object.keys(libraries);
                for (const libName of libNames) {
                    const libContent = libraries[libName];
                    const imports = extractImports(libContent);
                    const injectAt = Math.max(
                        ...bryModules.map((lib, idx) => (imports.includes(lib.name) ? idx : -1)),
                        -1
                    );
                    if (injectAt < 0) {
                        bryModules.splice(0, 0, { name: libName, content: libContent });
                    } else if (injectAt + 1 < bryModules.length) {
                        bryModules.splice(injectAt + 1, 0, {
                            name: libName,
                            content: libContent
                        });
                    } else {
                        bryModules.push({ name: libName, content: libContent });
                    }
                }
            }
            return {
                bryModules: bryModules
            };
        },
        async contentLoaded({ content, actions }) {
            const { setGlobalData, createData } = actions;
            const libUrl = isRemote ? libDir : path.join(context.baseUrl, libDir, '/');
            setGlobalData({
                libDir: libUrl
            });
        },
        configureWebpack() {
            return {
                module: {
                    rules: [
                        {
                            test: /\.raw\.*/,
                            type: 'asset/source'
                        }
                    ]
                }
            };
        },
        injectHtmlTags({ content }: { content: { bryModules: { name: string; content: string }[] } }) {
            return {
                headTags: [
                    {
                        tagName: 'script',
                        attributes: {
                            src: options.brythonSrc || DEFAULT_OPTIONS.brythonSrc,
                            crossorigin: 'anonymous',
                            referrerpolicy: 'no-referrer',
                            defer: 'defer'
                        }
                    },
                    {
                        tagName: 'script',
                        attributes: {
                            src: options.brythonStdlibSrc || DEFAULT_OPTIONS.brythonStdlibSrc,
                            crossorigin: 'anonymous',
                            referrerpolicy: 'no-referrer',
                            defer: 'defer'
                        }
                    }
                ],
                postBodyTags: content.bryModules.map((module) => {
                    return {
                        tagName: 'script',
                        attributes: {
                            id: module.name,
                            type: 'text/python'
                        },
                        innerHTML: module.content
                    };
                })
            };
        },
        getSwizzleComponentList() {
            return [];
        }
    } as Plugin;
};

export default theme;
export { validateThemeConfig } from './options';
export { ThemeOptions, Options };
