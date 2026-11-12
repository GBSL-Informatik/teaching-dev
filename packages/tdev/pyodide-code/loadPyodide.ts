import { PYODIDE_INDEX_URL } from './config';
import type { PyodideConfig } from 'pyodide';

export const loadPyodide = async (output: Pick<PyodideConfig, 'stdout' | 'stderr'> = {}) => {
    // Load the CDN module directly, outside the application bundle.
    const pyodideModule: typeof import('pyodide') = await import(
        /* webpackIgnore: true */ `${PYODIDE_INDEX_URL}pyodide.mjs`
    );
    return pyodideModule.loadPyodide({ indexURL: PYODIDE_INDEX_URL, ...output });
};
