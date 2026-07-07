import path from 'node:path';
import fs from 'node:fs/promises';
import { loadMaterialConfig, REPO_ROOT } from './helpers.js';
import minimist from 'minimist';
import { exit } from 'node:process';
import crypto from 'node:crypto';
process.chdir(REPO_ROOT);

const configs = loadMaterialConfig();
const allKlasses = Object.keys(configs);
const argv = minimist(process.argv.slice(2));

if (argv.help) {
    console.log(`
yarn run prepare_archive [classNames]

examples:

yarn run prepare_archive 30Gx               // prepares archive for a single class
yarn run prepare_archive 30Ga,30Gx          // prepares archive for multiple classes
`);
    exit(0);
}

const toArchive = (argv._[0] ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k && allKlasses.includes(k))
    .sort();

const DocsHome = `---
sidebar_position: 0.1
page_id: ${crypto.randomUUID()}
---

# Home
`;
const DOCS_FOLDER = path.join(REPO_ROOT, 'docs');
const VERSIONED_SIDEBARS = path.join(REPO_ROOT, 'versioned_sidebars');
const VERSIONED_DOCS = path.join(REPO_ROOT, 'versioned_docs');

const main = async (): Promise<void> => {
    for (const klass of allKlasses) {
        if (toArchive.includes(klass)) {
            continue;
        }
        const versionedDocsPath = path.join(VERSIONED_DOCS, `version-${klass}`);
        const sidebarPath = path.join(VERSIONED_SIDEBARS, `version-${klass}-sidebars.json`);
        await fs.rm(versionedDocsPath, { recursive: true, force: true });
        await fs.rm(sidebarPath, { force: true });
    }

    const archivedVersions = [...new Set([...toArchive])].sort();
    await fs.writeFile(path.join(REPO_ROOT, 'versions.json'), JSON.stringify(archivedVersions, null, 2));
    await fs.rm(DOCS_FOLDER, { recursive: true, force: true });
    await fs.mkdir(DOCS_FOLDER, { recursive: true });
    await fs.writeFile(path.join(DOCS_FOLDER, 'home.mdx'), DocsHome);

    console.log('✅ Created archive for:', toArchive.join(', '), argv);
};

main().catch((e: Error) => {
    console.error(e);
    process.exit(1);
});
