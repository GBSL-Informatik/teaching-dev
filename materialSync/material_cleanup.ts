import fs from 'fs';
import path from 'path';
import minimist from 'minimist';
import { loadMaterialConfig, resolveMaterialConfig } from './material_helpers';

const repoRoot = path.resolve(__dirname, '..');
process.chdir(repoRoot);

const configs = loadMaterialConfig();
const argv = minimist(process.argv.slice(2));

if (argv.help) {
    console.log(`
yarn run cleanup

examples:

yarn run cleanup
`);
    process.exit(0);
}

const klassen = Object.keys(configs);

klassen.forEach((klass) => {
    const config = configs[klass];
    const tmp_dir = `versioned_docs/version-${klass}/.tmp`;
    const copyBack: string[] = [];

    fs.mkdirSync(tmp_dir, { recursive: true });

    config.forEach((_config) => {
        const config = resolveMaterialConfig(klass, _config);
        const toPath = config?.to || `versioned_docs/version-${klass}/${config ? '' : _config}`;
        const ignoreList = config?.ignore || [];

        if (ignoreList.length > 0) {
            fs.mkdirSync(`${tmp_dir}/${toPath}`, { recursive: true });
        }

        ignoreList.forEach((keep) => {
            if (fs.existsSync(`${toPath}/${keep}`)) {
                const bkpLocation = `${tmp_dir}/${toPath}/${keep}`;
                if (!fs.existsSync(path.dirname(bkpLocation))) {
                    fs.mkdirSync(path.dirname(bkpLocation), { recursive: true });
                }
                fs.copyFileSync(`${toPath}/${keep}`, `${tmp_dir}/${toPath}/${keep}`);
            }
            copyBack.push(`${toPath}/${keep}`);
        });

        if (fs.existsSync(toPath)) {
            let parent = path.dirname(toPath);
            if (fs.lstatSync(toPath).isDirectory()) {
                fs.rmSync(toPath, { recursive: true, force: true });
            } else {
                fs.unlinkSync(toPath);
                const categoryPath = path.join(path.dirname(toPath), '_category_.json');
                if (config?.open) {
                    console.log(categoryPath, fs.existsSync(categoryPath));
                }
                if (config?.open && fs.existsSync(categoryPath)) {
                    console.log('REMOVE CAT', categoryPath);
                    fs.unlinkSync(categoryPath);
                }
            }
            while (fs.readdirSync(parent).length === 0) {
                fs.rmSync(parent, { recursive: true, force: true });
                parent = path.dirname(parent);
            }
        }
    });

    copyBack.forEach((f) => {
        if (!fs.existsSync(`${tmp_dir}/${f}`)) {
            return;
        }
        if (!fs.existsSync(path.dirname(f))) {
            fs.mkdirSync(path.dirname(f), { recursive: true });
        }
        fs.copyFileSync(`${tmp_dir}/${f}`, f);
    });

    fs.rmSync(tmp_dir, { recursive: true, force: true });
});
