import { LoadContext, Plugin, ThemeConfigValidationContext } from '@docusaurus/types';
import { Joi } from '@docusaurus/utils-validation';
import fs from 'fs-extra';
import path from 'path';
/**
 * Notes
 * - how to add static files: https://github.com/facebook/docusaurus/discussions/6907
 *  ---> sitemap plugin: https://github.com/facebook/docusaurus/blob/main/packages/docusaurus-plugin-sitemap/src/index.ts
 * - call brython with arguments: https://github.com/brython-dev/brython/issues/2421
 *
 */

export type ThemeOptions = {
    /**
     * The path to the brython source file.
     * @default 'https://raw.githack.com/brython-dev/brython/master/www/src/brython.js
     */
    brythonSrc: string;
    /**
     * The path to the brython standard library source file.
     * @default 'https://raw.githack.com/brython-dev/brython/master/www/src/brython_stdlib.js'
     */
    brythonStdlibSrc: string;
    /**
     * The folder path to brython specific libraries.
     * When a python file imports a module, the module is searched in the libDir directory.
     * By default, the libDir is created in the static folder and the needed python files are copied there.
     * This can be changed by setting `skipCopyAssetsToLibDir` to true and setting libDir to a custom path.
     * Make sure to copy the needed python files to the custom libDir.
     * @default '/bry-libs/'
     */
    libDir: string;
};

export type Options = Partial<ThemeOptions>;

export const DEFAULT_OPTIONS: ThemeOptions = {
    brythonSrc: 'https://cdn.jsdelivr.net/npm/brython@3.13.2/brython.min.js',
    brythonStdlibSrc: 'https://cdn.jsdelivr.net/npm/brython@3.13.2/brython_stdlib.js',
    libDir: '/bry-libs/'
};

const ThemeOptionSchema = Joi.object<ThemeOptions>({
    brythonSrc: Joi.string().default(DEFAULT_OPTIONS.brythonSrc),
    brythonStdlibSrc: Joi.string().default(DEFAULT_OPTIONS.brythonStdlibSrc),
    libDir: Joi.string().default(DEFAULT_OPTIONS.libDir)
});

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

interface BrythonModule {
    name: string;
    content: string;
}

export default function brythonPluginConfig(
    context: LoadContext,
    options: ThemeOptions
): Plugin<{ bryModules: BrythonModule[] }> {
    const libDir = prepareLibDir(options.libDir || DEFAULT_OPTIONS.libDir);
    const isRemote = /https?:\/\//.test(libDir);
    const isHashRouter = context.siteConfig.future?.experimental_router === 'hash';
    return {
        name: 'tdev-brython-code',
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
        async contentLoaded({ actions: { setGlobalData } }) {
            const libUrl = isRemote ? libDir : path.join(context.baseUrl, libDir, '/');
            setGlobalData({
                libDir: libUrl
            });
        },
        injectHtmlTags({ content }) {
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
        }
    };
}

export function validateThemeConfig({
    themeConfig,
    validate
}: ThemeConfigValidationContext<Options, ThemeOptions>): ThemeOptions {
    const validatedConfig = validate(ThemeOptionSchema, themeConfig);
    return validatedConfig;
}
