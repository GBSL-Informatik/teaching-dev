import type { PyodideAPI } from 'pyodide';

export const registerPythonModule = (pyodide: PyodideAPI, name: string, source: string) => {
    const moduleType = pyodide.pyimport('types.ModuleType');
    const modules = pyodide.pyimport('sys.modules');
    const module = moduleType(name);
    const namespace = module.__dict__;
    try {
        modules.set(name, module);
        namespace.set('__file__', `${name}.py`);
        pyodide.runPython(source, { globals: namespace, filename: `${name}.py` });
    } catch (error: unknown) {
        if (modules.has(name)) {
            modules.delete(name);
        }
        throw error;
    } finally {
        namespace.destroy();
        module.destroy();
        modules.destroy();
        moduleType.destroy();
    }
};
