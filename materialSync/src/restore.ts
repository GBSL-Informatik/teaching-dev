import fs from 'fs';
import { REPO_ROOT } from './helpers';

process.chdir(REPO_ROOT);

const main = (): void => {
    if (fs.existsSync('_docs') && fs.lstatSync('_docs').isDirectory()) {
        console.log('RENAMING docs/ to _docs/');
        if (fs.existsSync('docs')) {
            fs.rmSync('docs', { recursive: true });
        }
        fs.renameSync('_docs', 'docs');
    }
    if (fs.existsSync('_versioned_docs') && fs.lstatSync('_versioned_docs').isDirectory()) {
        console.log('RENAMING _versioned_docs/ to versioned_docs/');
        if (fs.existsSync('versioned_docs')) {
            fs.rmSync('versioned_docs', { recursive: true });
        }
        fs.renameSync('_versioned_docs', 'versioned_docs');
    }
    if (fs.existsSync('_versioned_sidebars') && fs.lstatSync('_versioned_sidebars').isDirectory()) {
        console.log('RENAMING _versioned_sidebars/ to versioned_sidebars/');
        if (fs.existsSync('versioned_sidebars')) {
            fs.rmSync('versioned_sidebars', { recursive: true });
        }
        fs.renameSync('_versioned_sidebars', 'versioned_sidebars');
    }
    if (fs.existsSync('_versions.json')) {
        console.log('RESTORE _versions.json to versions.json');
        if (fs.existsSync('versions.json')) {
            fs.rmSync('versions.json', { recursive: true });
        }
        fs.renameSync('_versions.json', 'versions.json');
    }
};

main();
