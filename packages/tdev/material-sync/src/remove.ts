import fs from 'node:fs';
import path from 'node:path';
import minimist from 'minimist';
import {
    docBasePath,
    ensureTrailingSlash,
    loadMaterialConfig,
    relative2Doc,
    REPO_ROOT,
    resolveMaterialConfig,
    saveMaterialConfig,
    SyncConfig
} from './helpers/index.js';

process.chdir(REPO_ROOT);

const configs = loadMaterialConfig();
const argv = minimist(process.argv.slice(2));

if (argv.help) {
    console.log(`
yarn run remove [source] [[--from="v1,v2"]]

examples:

yarn run remove docs/byod-basics/v24/ --from="24a,24b"
`);
    process.exit(0);
}

const toRemove = argv._;
const klassen = argv.from ? (argv.from as string).split(',') : Object.keys(configs);

klassen.forEach((klass) => {
    const klassConfig = configs[klass];
    const keepedFiles: SyncConfig[] = [];

    klassConfig.forEach((_config) => {
        const config = resolveMaterialConfig(klass, _config);
        const fromRel = relative2Doc(config.from);
        const from = `${docBasePath(config.from)}${fromRel}`;
        const to = config.to;
        let keep = true;

        toRemove.forEach((rmSrc) => {
            let toRmSrc = `${docBasePath(rmSrc)}${relative2Doc(rmSrc)}`;
            console.log(config.from, fromRel, docBasePath(rmSrc), from, toRmSrc);

            if (fs.lstatSync(toRmSrc).isDirectory()) {
                toRmSrc = ensureTrailingSlash(toRmSrc);
            }

            console.log(from, toRmSrc, from === toRmSrc);

            if (from === toRmSrc) {
                keep = false;
                if (fs.existsSync(to)) {
                    console.log('- remove', to, 'from', klass);
                    let parent = path.dirname(to);
                    if (fs.lstatSync(to).isDirectory()) {
                        console.log('rm dir', to);
                        fs.rmSync(to, { recursive: true, force: true });
                    } else {
                        fs.unlinkSync(to);
                    }
                    while (fs.readdirSync(parent).length === 0) {
                        fs.rmSync(parent, { recursive: true, force: true });
                        parent = path.dirname(parent);
                    }
                } else {
                    console.log('- unset', to, 'from', klass);
                }
            }
        });

        if (keep) {
            keepedFiles.push(_config);
        }
    });

    configs[klass] = keepedFiles;
});

saveMaterialConfig(configs);
console.log('done');
