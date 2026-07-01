import fs from 'node:fs/promises';
import path from 'node:path';
import Rsync from 'rsync';
import {
    ConfigType,
    ensureStartingSlash,
    ensureSync,
    ensureTrailingSlash,
    loadMaterialConfig,
    pathExists,
    REPO_ROOT,
    resolveMaterialConfig
} from './helpers.js';
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
    for (const klass of Object.keys(typedConfig)) {
        const config = typedConfig[klass];
        const gitignore: string[] = [];
        const classDir =
            klass === 'pages'
                ? 'src/pages/'
                : klass === 'docs'
                  ? undefined
                  : `versioned_docs/version-${klass}/`;
        for (const _config of config) {
            const config = resolveMaterialConfig(klass, _config);
            const resolvedClassDir = classDir ? classDir : config.to.split('/')[0] + '/';
            const ignore: string[] = [];
            ignore.push(...(config.ignore || []));

            let srcPath = config.from;

            if (process.env.WITHOUT_DOCS && config.from.startsWith('docs/')) {
                srcPath = `_${srcPath}`;
            }

            const isDir = (await fs.lstat(srcPath)).isDirectory();
            if (isDir) {
                srcPath = ensureTrailingSlash(srcPath);
            }

            const destParent = path.dirname(config.to);
            if (!(await pathExists(destParent))) {
                await fs.mkdir(destParent, { recursive: true });
            }

            if (isDir) {
                const sanitizedClassDir = ensureTrailingSlash(config.to.replace(resolvedClassDir, ''));
                gitignore.push(`${sanitizedClassDir}*`);
                const rsync = new Rsync()
                    .flags('v')
                    .source(srcPath)
                    .destination(config.to)
                    .archive()
                    .delete();
                if (ignore.length > 0) {
                    rsync.exclude(ignore.map((i) => ensureStartingSlash(i)));
                    for (const ifile of ignore) {
                        const opath = `${srcPath}${ifile}`;
                        const ipath = `${sanitizedClassDir}${ifile}`;
                        if (!(await pathExists(opath))) {
                            console.warn(
                                `⚠️ [ignore] ${klass}->${srcPath}: ignored "${ifile}" does not exist`
                            );
                            return;
                        }
                        if ((await fs.lstat(opath)).isDirectory()) {
                            gitignore.push(`!${ensureTrailingSlash(ipath)}`);
                        } else {
                            gitignore.push(`!${ipath}`);
                        }
                    }
                }
                rsync.exclude(['.sync.*', '*.nosync.*']);
                console.log('SYNC', config.to, srcPath);
                await ensureSync(rsync, srcPath);
            } else {
                await fs.copyFile(srcPath, config.to);
                gitignore.push(config.to.replace(resolvedClassDir, ''));
            }

            if (config.open) {
                const folder = isDir ? config.to : destParent;
                try {
                    await fs.mkdir(folder, { recursive: true });
                } catch (e) {
                    console.log(e);
                }
                const categoryPath = path.join(folder, '_category_.json');
                console.log('---------- CAT', categoryPath);
                gitignore.push(categoryPath.replace(resolvedClassDir, ''));
                let category: Record<string, unknown> = {
                    collapsible: true,
                    collapsed: false,
                    className: 'library-item marked'
                };
                if (await pathExists(categoryPath)) {
                    category = JSON.parse(await fs.readFile(categoryPath, 'utf-8'));
                    category.collapsed = false;
                    category.collapsible = true;
                    category.className = 'library-item marked';
                }
                await fs.writeFile(categoryPath, JSON.stringify(category, undefined, 2) + '\n');
            }

            await fs.writeFile(`${resolvedClassDir}.gitignore`, gitignore.join('\n'));
        }
    }
};

main().catch((e: Error) => {
    console.error(e);
    process.exit(1);
});
