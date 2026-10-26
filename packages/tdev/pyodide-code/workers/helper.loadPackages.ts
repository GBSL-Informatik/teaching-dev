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

type PackageContext = Context & { id: string; showPackageLogs?: boolean };

export const loadPackages = async (
    pyodide: PyodideAPI,
    context: PackageContext,
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
        await installPackages(pyodide, requirements, context);
    }
    await loadInferredPackage(context, () => pyodide.loadPackagesFromImports(code, loadCallbacks(context)));
    const missing = getMissingImports(pyodide, imports);
    const packages = new Set(missing.map((name) => packageAliases.get(name) || name));
    for (const name of packages) {
        await loadInferredPackage(context, () => installPackages(pyodide, [name], context));
    }
};

const loadInferredPackage = async (context: PackageContext, load: () => Promise<unknown>) => {
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

const installPackages = async (pyodide: PyodideAPI, packages: readonly string[], context: PackageContext) => {
    const requirements = [...new Set(packages)];
    await pyodide.loadPackage('micropip', loadCallbacks(context));
    const micropip = pyodide.pyimport('micropip');
    try {
        await micropip.install.callKwargs(requirements, { verbose: !!context.showPackageLogs });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Could not install Python packages (${requirements.join(', ')}): ${message}`);
    } finally {
        micropip.destroy();
    }
};

const loadCallbacks = (context: PackageContext) => {
    const send = (type: 'log' | 'error', message: string) => {
        if (context.showPackageLogs) {
            // Progress is best-effort; required diagnostics remain awaited.
            void Promise.resolve()
                .then(() =>
                    context.sendMessage({ type, message, id: context.id, timeStamp: context.getTime() })
                )
                .catch((error: unknown) => {
                    console.error('Could not deliver Python package progress.', error);
                });
        }
    };
    return {
        messageCallback: (message: string) => send('log', message),
        errorCallback: (message: string) => send('error', message)
    };
};
