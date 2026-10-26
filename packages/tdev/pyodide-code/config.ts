import { dependencies } from './package.json';

export const PYODIDE_VERSION = dependencies.pyodide;
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

export const DOCUSAURUS_SW_SCOPE = '/' as const;

export const PY_INPUT = 'PY_INPUT' as const;
export const PY_AWAIT_INPUT = 'PY_AWAIT_INPUT' as const;
export const PY_STDIN_ROUTE = `${DOCUSAURUS_SW_SCOPE}py-get-input/` as const;
export const PY_CANCEL_INPUT = 'PY_CANCEL_INPUT' as const;
export const PY_CANCEL_ALL = 'PY_CANCEL_ALL' as const;
