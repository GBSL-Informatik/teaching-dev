import fs from 'node:fs/promises';
import path from 'node:path';
import { ConfigType, loadMaterialConfig, pathExists, REPO_ROOT } from './helpers/index.js';
import { syncMaterials } from './helpers/syncMaterials.js';
process.chdir(REPO_ROOT);

const typedConfig: ConfigType = loadMaterialConfig();

/**
 * Recursively find markdown template files (starting with _)
 */
const findMdTemplate = async (src: string): Promise<string[]> => {
    const mdFiles: string[] = [];
    const srcStat = await fs.lstat(src);
    if (srcStat.isDirectory()) {
        const files = await fs.readdir(src);
        for (const file of files) {
            const fname = path.join(src, file);
            const fileStat = await fs.lstat(fname);
            if (fileStat.isDirectory()) {
                mdFiles.push(...(await findMdTemplate(fname)));
            } else if ((file.endsWith('.md') || file.endsWith('.mdx')) && file.startsWith('_')) {
                mdFiles.push(fname);
            }
        }
    } else {
        if ((src.endsWith('.md') || src.endsWith('.mdx')) && src.startsWith('_')) {
            mdFiles.push(src);
        }
    }
    return mdFiles;
};

const main = async (): Promise<void> => {
    if (process.env.WITHOUT_DOCS) {
        /**
         * move docs/ to _docs/ and make sure docusaurus can still build the site.
         * Can be undone by running the restore script.
         */
        console.log('RENAMING docs/ to _docs/');
        await fs.rename('docs', '_docs');
        await fs.mkdir('docs');
        await fs.cp('_docs/home.md', 'docs/home.md');
        /** copy all markdown-templates - otherwise some pages might fail */
        const templates = await findMdTemplate(path.join(REPO_ROOT, '_docs'));
        await Promise.all(templates.map((file) => fs.cp(file, file.replace('/_docs/', '/docs/'))));
    }
    if (process.env.DOCS_ONLY) {
        /* Build only the docs - can be undone by running the restore script */
        if (await pathExists('versioned_docs')) {
            console.log('RENAMING versioned_docs/ to _versioned_docs/');
            await fs.rename('versioned_docs', '_versioned_docs');
            await fs.mkdir('versioned_docs');
        }
        if (await pathExists('versioned_sidebars')) {
            console.log('RENAMING versioned_sidebars/ to _versioned_sidebars/');
            await fs.rename('versioned_sidebars', '_versioned_sidebars');
            await fs.mkdir('versioned_sidebars');
        }
        if (await pathExists('versions.json')) {
            console.log('RENAMING versions.json to _versions.json');
            await fs.rename('versions.json', '_versions.json');
            await fs.writeFile('versions.json', '[\n  "current"\n]');
        }
    }
    if (await pathExists('CNAME')) {
        await fs.cp('CNAME', 'static/CNAME');
    }
    await syncMaterials(typedConfig, { withoutDocs: !!process.env.WITHOUT_DOCS });
};

main().catch((e: Error) => {
    console.error(e);
    process.exit(1);
});
