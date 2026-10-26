import type { PyodideAPI } from 'pyodide';
import { type Context, pyodideJsModules } from '../pyodideJsModules';
import { registerJsModule } from './registerJsModule';

const siteModules = new Set(Object.keys(pyodideJsModules));
const internalModules = new Set(['tdev', 'browser_input']);
const packageAliases = new Map([
    ['PIL', 'Pillow'],
    ['cv2', 'opencv-python'],
    ['sklearn', 'scikit-learn'],
    ['bs4', 'beautifulsoup4']
]);

export const loadPackages = async (
    pyodide: PyodideAPI,
    context: Context & { id: string },
    code: string,
    requirements: readonly string[] = []
) => {
    const imports = getImports(pyodide, code);
    for (const name of imports) {
        const factory = pyodideJsModules[name as keyof typeof pyodideJsModules];
        if (siteModules.has(name) && factory) {
            registerJsModule(pyodide, name, factory(context));
        }
    }
    if (requirements.length > 0) {
        await installPackages(pyodide, requirements);
    }
    await loadInferredPackage(context, () => pyodide.loadPackagesFromImports(code));
    const missing = getMissingImports(pyodide, imports);
    const packages = new Set(missing.map((name) => packageAliases.get(name) || name));
    for (const name of packages) {
        await loadInferredPackage(context, () => installPackages(pyodide, [name]));
    }
};

const loadInferredPackage = async (context: Context & { id: string }, load: () => Promise<unknown>) => {
    try {
        await load();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        await context.sendMessage({
            type: 'error',
            message: `Automatic Python package loading failed: ${message}`,
            id: context.id,
            timeStamp: context.getTime()
        });
    }
};

const getImports = (pyodide: PyodideAPI, code: string): string[] => {
    const findImports = pyodide.pyimport('pyodide.code.find_imports');
    try {
        const imports = findImports(code);
        try {
            const names: string[] = imports.toJs();
            return [...new Set(names.map((name) => name.split('.')[0]).filter(Boolean))];
        } finally {
            imports.destroy();
        }
    } finally {
        findImports.destroy();
    }
};

const getMissingImports = (pyodide: PyodideAPI, imports: string[]): string[] => {
    const stdlib = pyodide.pyimport('sys.stdlib_module_names');
    const modules = pyodide.pyimport('sys.modules');
    const findSpec = pyodide.pyimport('importlib.util.find_spec');
    try {
        const standardNames: Set<string> = stdlib.toJs();
        return imports.filter((name) => {
            if (
                siteModules.has(name) ||
                internalModules.has(name) ||
                standardNames.has(name) ||
                modules.has(name)
            ) {
                return false;
            }
            const spec = findSpec(name);
            if (!spec) {
                return true;
            }
            spec.destroy();
            return false;
        });
    } finally {
        findSpec.destroy();
        modules.destroy();
        stdlib.destroy();
    }
};

const installPackages = async (pyodide: PyodideAPI, packages: readonly string[]) => {
    const requirements = [...new Set(packages)];
    await pyodide.loadPackage('micropip');
    const micropip = pyodide.pyimport('micropip');
    try {
        await micropip.install(requirements);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Could not install Python packages (${requirements.join(', ')}): ${message}`);
    } finally {
        micropip.destroy();
    }
};
