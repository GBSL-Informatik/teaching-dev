import { Joi } from '@docusaurus/utils-validation';

import type { ThemeConfigValidationContext } from '@docusaurus/types';

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
    brythonSrc: 'https://cdn.jsdelivr.net/npm/brython@3.12.4/brython.min.js',
    brythonStdlibSrc: 'https://cdn.jsdelivr.net/npm/brython@3.12.4/brython_stdlib.js',
    libDir: '/bry-libs/'
};

const ThemeOptionSchema = Joi.object<ThemeOptions>({
    brythonSrc: Joi.string().default(DEFAULT_OPTIONS.brythonSrc),
    brythonStdlibSrc: Joi.string().default(DEFAULT_OPTIONS.brythonStdlibSrc),
    libDir: Joi.string().default(DEFAULT_OPTIONS.libDir)
});

export function validateThemeConfig({
    themeConfig,
    validate
}: ThemeConfigValidationContext<Options, ThemeOptions>): ThemeOptions {
    const validatedConfig = validate(ThemeOptionSchema, themeConfig);
    return validatedConfig;
}
