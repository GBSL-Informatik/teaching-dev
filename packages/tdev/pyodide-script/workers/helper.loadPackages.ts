import type { PyodideAPI } from 'pyodide';

const getPackageImports = (code: string): string[] => {
    const importStatements = code.split('\n').filter((line) => /^import |^from /.test(line));
    const importPackages = importStatements.flatMap((line) => {
        const match = line.match(/^import (?<names>.+)|^from (?<name>\S+) /);
        if (match) {
            if (match.groups?.names) {
                return match.groups.names.split(',').map((n) => n.trim().split(' ')[0]);
            } else if (match.groups?.name && !match.groups.name.startsWith('.')) {
                return [match.groups.name];
            }
        }
        return [];
    });
    return importPackages;
};

export const loadPackages = async (pyodide: PyodideAPI, code: string) => {
    const importPackages = getPackageImports(code);

    await Promise.all(
        importPackages.map(async (pkg) => {
            try {
                await pyodide.loadPackage(pkg);
            } catch (e) {
                // Package not found, ignore
                console.warn(`Package ${pkg} could not be loaded:`, e);
            }
        })
    );
};
