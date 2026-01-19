import type { PyodideAPI } from 'pyodide';
import { type Context, pyodideJsModules } from '../pyodideJsModules';
import _ from 'es-toolkit/compat';
const siteModules = new Set(Object.keys(pyodideJsModules));
const StandardPythonNamespaces = new Set([
    'xml',
    'http',
    'urllib',
    'email',
    'concurrent',
    'importlib',
    'logging',
    'tkinter',
    'unittest',
    'asyncio'
]);
const StandardPythonPackages = new Set([
    'ast',
    'math',
    'random',
    'datetime',
    'json',
    're',
    'sys',
    'os',
    'functools',
    'itertools',
    'collections',
    'typing',
    'time',
    'threading',
    'subprocess',
    'pathlib',
    'shutil',
    'tempfile',
    'hashlib',
    'hmac',
    'base64',
    'struct',
    'socket',
    'ssl',
    'copy',
    'csv',
    'pickle',
    'enum',
    'configparser',
    'inspect',
    'traceback',
    'glob',
    'bisect',
    'heapq',
    'queue',
    'weakref',
    'argparse',
    'string',
    'sysconfig',
    'pkgutil'
]);

const getPackageImports = (code: string): string[] => {
    const importStatements = code.split('\n').filter((line) => /^import |^from /.test(line));
    const importPackages = importStatements.flatMap((line) => {
        const match = line.match(/^import (?<names>.+)|^from (?<name>\S+) /);
        if (match) {
            if (match.groups?.names) {
                return match.groups.names.split(',').map((n) => n.trim().split(' ')[0].split('.')[0]);
            } else if (match.groups?.name && !match.groups.name.startsWith('.')) {
                return [match.groups.name.split('.')[0]];
            }
        }
        return [];
    });
    return importPackages.filter(
        (pkg) => !StandardPythonPackages.has(pkg) && !StandardPythonNamespaces.has(pkg)
    );
};

export const loadPackages = async (pyodide: PyodideAPI, context: Context, code: string) => {
    const importPackages = getPackageImports(code);
    const packages = _.groupBy(importPackages, (p) => (siteModules.has(p) ? 'site' : 'micropip'));
    const sitePkgs = packages['site'] || [];
    if (sitePkgs.length > 0) {
        for (const pkg of sitePkgs) {
            const moduleFactory = pyodideJsModules[pkg as keyof typeof pyodideJsModules];
            if (moduleFactory) {
                const module = moduleFactory(context);
                pyodide.registerJsModule(pkg, module);
            }
        }
    }
    const micropipPkgs = packages['micropip'] || [];
    if (micropipPkgs.length > 0) {
        await pyodide.loadPackage('micropip');
        const micropip = pyodide.pyimport('micropip');
        await Promise.all(
            micropipPkgs.map(async (pkg) => {
                try {
                    await micropip.install(pkg);
                } catch (e) {
                    // Package not found, ignore
                    console.warn(`Package ${pkg} could not be loaded:`, e);
                }
            })
        );
    }
};
