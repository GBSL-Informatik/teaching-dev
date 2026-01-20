import path from 'path';
import type { LoadContext, Plugin } from '@docusaurus/types';
const aliasConfigurationPlugin: Plugin = (context: LoadContext, options?: { websiteDir?: string }) => {
    const websiteDir = options?.websiteDir ? options.websiteDir : './website';
    return {
        name: 'alias-configuration',
        getThemePath() {
            const cwd = process.cwd();
            const siteSrcPath = path.resolve(cwd, websiteDir);
            return siteSrcPath;
        },
        configureWebpack() {
            const cwd = process.cwd();
            return {
                resolve: {
                    alias: {
                        '@tdev-components': [
                            path.resolve(cwd, websiteDir, './components'),
                            path.resolve(cwd, './src/components')
                        ],
                        '@tdev-hooks': [
                            path.resolve(cwd, websiteDir, './hooks'),
                            path.resolve(cwd, './src/hooks')
                        ],
                        '@tdev-models': [
                            path.resolve(cwd, websiteDir, './models'),
                            path.resolve(cwd, './src/models')
                        ],
                        '@tdev-stores': [
                            path.resolve(cwd, websiteDir, './stores'),
                            path.resolve(cwd, './src/stores')
                        ],
                        '@tdev-api': [path.resolve(cwd, websiteDir, './api'), path.resolve(cwd, './src/api')],
                        '@tdev-plugins': [
                            path.resolve(cwd, websiteDir, './plugins'),
                            path.resolve(cwd, './src/plugins')
                        ],
                        '@tdev': [
                            path.resolve(cwd, websiteDir),
                            path.resolve(cwd, websiteDir, './packages'),
                            path.resolve(cwd, './src'),
                            path.resolve(cwd, './packages/tdev')
                        ],
                        /** original tdev source */
                        '@tdev-original': [path.resolve(cwd, './src'), path.resolve(cwd, './packages/tdev')]
                    },
                    // "symlinks: false" would support to resolve symlinks in monorepos, but breaks yarn workspaces :/
                    symlinks: true
                },
                watchOptions: {
                    // ensure changes in symlinked packages are picked up on osx
                    followSymlinks: true
                },
                optimization: {
                    concatenateModules: false
                }
            };
        }
    };
};

export default aliasConfigurationPlugin;
