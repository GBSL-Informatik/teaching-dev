import type { SiteConfig } from '@tdev/siteConfig/siteConfig';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { PyodideDocsOptions } from '.';
import pyodidePlugin, { type PluginOptions } from '../plugin';

export const pyodideDocsOptions = (siteConfig: SiteConfig): PyodideDocsOptions => {
    const resolve = createRequire(import.meta.url).resolve;
    const pluginPath = resolve('../plugin.ts');
    let extensions: PluginOptions['extensions'];
    for (const configuration of siteConfig.plugins ?? []) {
        const [plugin, options] = Array.isArray(configuration) ? configuration : [configuration, {}];
        if (isPyodidePlugin(plugin, pluginPath)) {
            extensions = (options as PluginOptions).extensions;
        }
    }
    return {
        websiteDir: path.resolve(siteConfig.websiteDir ?? 'website'),
        extensions
    };
};

const isPyodidePlugin = (plugin: unknown, pluginPath: string): boolean => {
    if (
        plugin === pyodidePlugin ||
        plugin === '@tdev/pyodide-code/plugin' ||
        plugin === '@tdev/pyodide-code/plugin.ts'
    ) {
        return true;
    }
    if (typeof plugin !== 'string' || (!plugin.startsWith('.') && !path.isAbsolute(plugin))) {
        return false;
    }
    const resolvedPath = path.resolve(plugin);
    return resolvedPath === pluginPath || `${resolvedPath}.ts` === pluginPath;
};
