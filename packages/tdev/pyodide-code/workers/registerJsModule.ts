import type { PyodideAPI } from 'pyodide';

export const registerJsModule = (pyodide: PyodideAPI, name: string, module: object) => {
    const modules = pyodide.pyimport('sys.modules');
    const cachedNames = pyodide.runPython('tuple(__import__("sys").modules)');
    try {
        for (const cachedName of cachedNames) {
            if (cachedName === name || cachedName.startsWith(`${name}.`)) {
                modules.delete(cachedName);
            }
        }
    } finally {
        cachedNames.destroy();
        modules.destroy();
    }
    pyodide.registerJsModule(name, module);
};
