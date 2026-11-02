import type { SiteConfig } from '@tdev/siteConfig/siteConfig';
import fs from 'node:fs/promises';
import path from 'node:path';
import { readExtensionDescriptor, resolveExtensions, type PluginOptions } from '../extensions/config';
import { pyodideDocsOptions } from './configuration';

export interface PyodideDocsOptions {
    websiteDir: string;
    extensions?: PluginOptions['extensions'];
    siteDir?: string;
}

export const getExtensionRoots = (websiteDir: string): string[] => [
    path.resolve(websiteDir, 'pyodide'),
    path.resolve(websiteDir, 'packages/pyodide')
];

export const createDocsSync = (siteConfig: SiteConfig) => {
    const options = pyodideDocsOptions(siteConfig);
    const configuredDirectories = (options.extensions ?? [])
        .filter((extension): extension is string => typeof extension === 'string')
        .map((directory) => path.resolve(directory));
    return {
        watchPaths: [...getExtensionRoots(options.websiteDir), ...configuredDirectories],
        sync: (destination: string) => syncPyodideDocs(destination, options)
    };
};

export const syncPyodideDocs = async (packageDocsDir: string, options: PyodideDocsOptions) => {
    const destination = path.join(packageDocsDir, 'tdev/pyodide-code/extensions');
    if (!(await exists(path.dirname(destination)))) {
        return;
    }
    const siteDir = options.siteDir ?? process.cwd();
    const enabledExtensions = resolveExtensions(siteDir, {
        extensions: options.extensions
    });
    const directories = await discoverExtensions(options);
    const names = new Set<string>();
    const links: string[] = [];
    const sourceRoots = getExtensionRoots(options.websiteDir)
        .map((directory) => `\`${path.relative(siteDir, directory).split(path.sep).join('/')}\``)
        .join(' und ');

    await fs.rm(destination, { recursive: true, force: true });
    await fs.mkdir(destination, { recursive: true });
    for (const directory of directories) {
        const descriptor = readExtensionDescriptor(directory);
        if (names.has(descriptor.name)) {
            throw new Error(`Duplicate Pyodide extension documentation: ${descriptor.name}`);
        }
        names.add(descriptor.name);
        const target = path.join(destination, descriptor.name);
        if (!descriptor.showcase) {
            const readme = await copyReadme(directory, target);
            if (readme) {
                links.push(`- [${descriptor.name}](./${descriptor.name}/${readme})`);
            }
            continue;
        }

        // Inactive extensions need no resolvable runtime entries, even if another extension is enabled.
        const mayBeEnabled = enabledExtensions.some((extension) => {
            const clientPath = path.relative(directory, extension.client);
            return (
                extension.name === descriptor.name ||
                (clientPath !== '..' &&
                    !clientPath.startsWith(`..${path.sep}`) &&
                    !path.isAbsolute(clientPath))
            );
        });
        if (!mayBeEnabled) {
            continue;
        }
        const [resolved] = resolveExtensions(siteDir, { extensions: [directory] });
        const enabled = enabledExtensions.some(
            (extension) => extension.client === resolved.client && extension.worker === resolved.worker
        );
        if (!enabled) {
            continue;
        }
        const showcase = await resolveShowcase(directory, descriptor.name, descriptor.showcase);
        const entry = await showcaseEntry(showcase);
        await fs.cp(showcase, target, { recursive: true });
        const source = path.relative(siteDir, showcase).split(path.sep).join('/');
        links.push(`- [${descriptor.name}: Showcase](./${descriptor.name}/${entry}) – Quelle: \`${source}\``);
    }

    const content = `---
page_id: 93dc0300-374a-4fe9-95b7-8311ef95423c
---

# Pyodide-Erweiterungen

Hier stehen die Anleitungen der verfügbaren Erweiterungen. Live-Beispiele erscheinen für konfigurierte Erweiterungen.

Die Erweiterungen werden aus ${sourceRoots} sowie ausdrücklich konfigurierten Erweiterungsordnern übernommen. Die Live-Beispiele stammen aus dem Ordner, den die jeweilige \`extension.json\` im Feld \`showcase\` angibt. Alle Quellpfade sind relativ zum Website-Projektverzeichnis angegeben.

${links.length ? links.join('\n') : 'Für diese Website sind keine Erweiterungsdokumentationen verfügbar.'}
`;
    await fs.writeFile(path.join(destination, 'index.md'), content);
    await makeFilesReadOnly(destination);
};

const makeFilesReadOnly = async (directory: string): Promise<void> => {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
        const filePath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            await makeFilesReadOnly(filePath);
        } else if (entry.isFile()) {
            const { mode } = await fs.stat(filePath);
            await fs.chmod(filePath, mode & ~0o222);
        }
    }
};

const discoverExtensions = async (options: PyodideDocsOptions): Promise<string[]> => {
    const directories = new Set<string>();
    for (const root of getExtensionRoots(options.websiteDir)) {
        if (!(await exists(root))) {
            continue;
        }
        const children = await fs.readdir(root, { withFileTypes: true });
        for (const child of children) {
            const directory = path.join(root, child.name);
            if (child.isDirectory() && (await exists(path.join(directory, 'extension.json')))) {
                directories.add(directory);
            }
        }
    }
    for (const extension of options.extensions ?? []) {
        if (typeof extension === 'string') {
            directories.add(path.resolve(options.siteDir ?? process.cwd(), extension));
        }
    }
    return [...directories].sort();
};

const copyReadme = async (directory: string, destination: string): Promise<string | undefined> => {
    const entries = await fs.readdir(directory);
    const readme = ['README.mdx', 'README.md'].find((name) => entries.includes(name));
    if (!readme) {
        return;
    }
    await fs.mkdir(destination, { recursive: true });
    await fs.copyFile(path.join(directory, readme), path.join(destination, readme));
    for (const asset of ['assets', 'images', 'img']) {
        if (entries.includes(asset)) {
            await fs.cp(path.join(directory, asset), path.join(destination, asset), { recursive: true });
        }
    }
    return readme;
};

const resolveShowcase = async (directory: string, name: string, relativePath: string): Promise<string> => {
    const showcase = path.resolve(directory, relativePath);
    const extensionRoot = await fs.realpath(directory);
    const realShowcase = await fs.realpath(showcase).catch(() => undefined);
    const containedPath = realShowcase && path.relative(extensionRoot, realShowcase);
    if (
        path.isAbsolute(relativePath) ||
        !containedPath ||
        containedPath === '..' ||
        containedPath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(containedPath) ||
        !(await fs.stat(showcase)).isDirectory()
    ) {
        throw new Error(
            `Invalid showcase for Pyodide extension ${name}: ${relativePath}. Expected a directory inside the extension.`
        );
    }
    return showcase;
};

const showcaseEntry = async (directory: string): Promise<string> => {
    const entries = await fs.readdir(directory);
    const preferred = ['index.mdx', 'index.md', 'README.mdx', 'README.md'];
    const entry = preferred.find((name) => entries.includes(name));
    if (!entry) {
        throw new Error(`Pyodide showcase needs an index.md(x) or README.md(x) page: ${directory}`);
    }
    return entry.split(path.sep).join('/');
};

const exists = async (filePath: string): Promise<boolean> => {
    try {
        await fs.access(filePath);
        return true;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return false;
        }
        throw error;
    }
};
