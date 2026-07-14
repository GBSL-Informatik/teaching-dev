import fs from 'node:fs';
import { exit } from 'node:process';
import minimist from 'minimist';
import {
    DOC_PATHS,
    loadMaterialConfig,
    relative2Doc,
    REPO_ROOT,
    resolveMaterialConfig,
    saveMaterialConfig
} from './helpers/index.js';

process.chdir(REPO_ROOT);

const configs = loadMaterialConfig();
const argv = minimist(process.argv.slice(2));

if (argv.help) {
    console.log(`
yarn run add [source] [[--to="v1,v2"]] [[--as="destination-name"]] [[--ignore="file1,file2"]]

examples:

yarn run add docs/byod-basics/v24/ --to="24a,24b"   // --> adds /byod-basics/v24 to 24a & 24b
yarn run add docs/byod-basics/v24/ --to="24a,24b" --as="My-Material" // --> adds /byod-basics to 24a & 24b
yarn run add docs/byod-basics/v24/ --to="24a,24b" --as="My-Material" --ignore="_category_.json,*.txt"
`);
    exit(0);
}

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
const asPath = argv.as || argv.name || relative2Doc(src);
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

    configs[klass].push({ from: src, as: asPath, ignore: ignore });
});

saveMaterialConfig(configs);
