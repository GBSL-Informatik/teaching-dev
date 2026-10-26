import { type PyodideAPI } from 'pyodide';
import React from 'react';
import { loadPyodide } from '../loadPyodide';

const pyodide: { lib: null | PyodideAPI } = {
    lib: null
};

export const usePyodideLib = (): PyodideAPI | null => {
    const [Lib, setLib] = React.useState<PyodideAPI | null>(pyodide.lib);
    React.useEffect(() => {
        if (Lib) {
            return;
        }
        let cancelled = false;

        loadPyodide().then((pyodideInstance) => {
            if (cancelled) {
                return;
            }
            if (!pyodide.lib) {
                pyodide.lib = pyodideInstance;
            }
            setLib(pyodideInstance);
        });

        return () => {
            cancelled = true;
        };
    }, []);
    return Lib;
};
