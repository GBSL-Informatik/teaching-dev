import { type PyodideAPI } from 'pyodide';
import React from 'react';
import { loadPyodide } from '../loadPyodide';

const pyodide: { lib: PyodideAPI | null; loading: Promise<PyodideAPI | null> | null } = {
    lib: null,
    loading: null
};

const loadSharedRuntime = () => {
    if (!pyodide.loading) {
        pyodide.loading = loadPyodide().then(
            (instance) => {
                pyodide.lib = instance;
                return instance;
            },
            (error: unknown) => {
                pyodide.loading = null;
                console.error('Could not load the shared Python runtime.', error);
                return null;
            }
        );
    }
    return pyodide.loading;
};

export const usePyodideLib = (): PyodideAPI | null => {
    const [Lib, setLib] = React.useState<PyodideAPI | null>(pyodide.lib);
    React.useEffect(() => {
        if (Lib) {
            return;
        }
        let cancelled = false;

        loadSharedRuntime().then((pyodideInstance) => {
            if (cancelled || !pyodideInstance) {
                return;
            }
            setLib(pyodideInstance);
        });

        return () => {
            cancelled = true;
        };
    }, []);
    return Lib;
};
