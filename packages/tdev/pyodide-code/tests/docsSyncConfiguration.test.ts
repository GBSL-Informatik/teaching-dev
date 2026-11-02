import type { PluginModule } from '@docusaurus/types';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { pyodideDocsOptions } from '../docsSync/configuration';
import pyodidePlugin from '../plugin';

describe('Pyodide documentation configuration', () => {
    it('ignores unrelated Docusaurus shorthand plugins', () => {
        expect(pyodideDocsOptions({ plugins: ['content-pages'] })).toEqual({
            websiteDir: path.resolve('website'),
            extensions: undefined
        });
    });

    it('uses the active website and the existing extension registrations', () => {
        const extensions = ['./website/pyodide/clock'];
        expect(
            pyodideDocsOptions({
                websiteDir: 'custom/website',
                plugins: [['@tdev/pyodide-code/plugin', { extensions }]]
            })
        ).toEqual({ websiteDir: path.resolve('custom/website'), extensions });
    });

    it('recognizes a directly imported Pyodide plugin', () => {
        const extensions = ['./website/pyodide/clock'];
        expect(
            pyodideDocsOptions({ plugins: [[pyodidePlugin as PluginModule, { extensions }]] }).extensions
        ).toBe(extensions);
    });

    it('recognizes a relative Pyodide plugin path without resolving unrelated plugin names', () => {
        const extensions = ['./website/pyodide/clock'];
        expect(
            pyodideDocsOptions({
                plugins: ['content-pages', ['./packages/tdev/pyodide-code/plugin', { extensions }]]
            }).extensions
        ).toBe(extensions);
    });
});
