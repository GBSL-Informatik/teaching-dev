import { PYODIDE_INDEX_URL } from './config';

export const loadPyodide = async () => {
    const pyodideModule: typeof import('pyodide') = await import(
        /* webpackIgnore: true */
        // Load the CDN module directly, outside the application bundle.
        `${PYODIDE_INDEX_URL}pyodide.mjs`
    );
    return pyodideModule.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
};
