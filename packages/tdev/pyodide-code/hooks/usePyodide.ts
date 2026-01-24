import { type PyodideAPI } from 'pyodide';
import React from 'react';

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

        // load script if not yet loaded
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.js';
        script.onload = () => {
            (window as any)
                .loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.1/full/' })
                .then((pyodideInstance: PyodideAPI) => {
                    if (cancelled) {
                        return;
                    }
                    if (!pyodide.lib) {
                        pyodide.lib = pyodideInstance;
                    }
                    setLib(pyodideInstance);
                });
        };
        document.body.appendChild(script);

        return () => {
            cancelled = true;
        };
    }, []);
    return Lib;
};
