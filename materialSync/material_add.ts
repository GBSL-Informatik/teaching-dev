import fs from 'fs';
import path from 'path';
import { exit } from 'process';
import minimist from 'minimist';
import { loadMaterialConfig, resolveMaterialConfig, saveMaterialConfig } from './material_helpers';

const repoRoot = path.resolve(__dirname, '..');
process.chdir(repoRoot);

const configs = loadMaterialConfig();
const argv = minimist(process.argv.slice(2));

if (argv.help) {
    console.log(`
yarn run add [source] [[--to="v1,v2"]] [[--as="destination-name"]] [[--ignore="file1,file2"]]

examples:

yarn run add docs/byod-basics/v24/ --to="24a,24b"   // --> adds /byod-basics/v24 to 24a & 24b
yarn run add docs/byod-basics/v24/ --to="24a,24b" --as="My-Material" // --> adds /byod-basics to 24a & 24b
yarn run add byod-basics/v24/ --to="24a,24b" --as="My-Material" // same as above
yarn run add byod-basics/v24 --to="24a,24b" --as="My-Material"  // same as above
yarn run add docs/byod-basics/v24/ --to="24a,24b" --as="My-Material" --ignore="_category_.json,*.txt"
`);
    exit(0);
}

const DOC_PATHS = ['docs/', 'src/pages/', 'blog/'];

const docBasePath = (src: string): string => {
    return DOC_PATHS.find((p) => src.startsWith(p)) || DOC_PATHS[0];
};

/**
 * Get path relative to doc base path
 */
const relative2Doc = (p: string): string => {
    const base = docBasePath(p);
    return base ? p.slice(base.length) : p;
};

let src: string = argv._[0];

const pathStart = DOC_PATHS.find((p) => src.startsWith(p));

if (!pathStart && !src.startsWith('/')) {
    src = `${DOC_PATHS[0]}${src}`;
}

const isDir = fs.lstatSync(src).isDirectory();
if (isDir && !src.endsWith('/')) {
    src = src + '/';
}

const klassen = argv.to ? (argv.to as string).split(',') : Object.keys(configs);
const to = argv.as || argv.name || relative2Doc(src);
let ignore: string[] = [];

if (argv.ignore) {
    ignore = (argv.ignore as string)
        .split(',')
        .map((p) => p.replace(/^\/+/, '')) // remove '/' at the start
        .map((p) => p.replace(src, '')); // remove relative path if present
}

klassen.forEach((klass) => {
    if (!Object.keys(configs).includes(klass)) {
        console.log(`⚠️ 
        Klasse not found, skipping: ${klass}
        `);
        return;
    }
    configs[klass] = configs[klass].filter((_config) => {
        const config = resolveMaterialConfig(klass, _config);
        if (config.from === src) {
            console.log('ℹ️  Modify old source: ', config.from);
            return false;
        }
        return true;
    });

    const toPath = `versioned_docs/version-${klass}/${to}`;
    configs[klass].push({ from: src, to: toPath, ignore: ignore });
});

saveMaterialConfig(configs);
