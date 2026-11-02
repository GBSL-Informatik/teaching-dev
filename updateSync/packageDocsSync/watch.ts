import chokidar from 'chokidar';
import 'dotenv/config';
import minimist from 'minimist';
import path from 'path';
import packageDocsSync from '.';
import { categoryFileLocation, getDebouncedSyncer, packageInfo, syncCategoryFile } from './actions';
import { loadPyodideDocsSync } from './configuration';

const argv = minimist(process.argv.slice(2), {
    string: ['src', 'dest'],
    boolean: ['skip-initial'],
    alias: { src: 'packages', dest: 'out' },
    default: {
        src: 'packages'
    }
});

const PACKAGES_DIR = path.resolve(process.cwd(), argv.src);
const DEST_ROOT = path.resolve(process.cwd(), argv.dest);

const main = async () => {
    const pyodide = await loadPyodideDocsSync(PACKAGES_DIR);
    const extensionPaths = pyodide?.watchPaths ?? [];
    if (!argv['skip-initial']) {
        await packageDocsSync(PACKAGES_DIR, DEST_ROOT, pyodide);
    }
    const { syncQueue, syncDebounced } = await getDebouncedSyncer(
        PACKAGES_DIR,
        DEST_ROOT,
        pyodide ? () => pyodide.sync(DEST_ROOT) : undefined
    );
    const watcher = chokidar.watch([PACKAGES_DIR, ...extensionPaths], {
        ignoreInitial: true,
        persistent: true,
        ignored: /(^|[/\\])node_modules([/\\]|$)/
    });

    watcher
        .on('all', async (_event, filePath) => {
            const isExtension = extensionPaths.some((directory) => {
                const relativePath = path.relative(directory, filePath);
                return (
                    relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
                );
            });
            if (isExtension) {
                syncDebounced();
                return null;
            }
            const pkgInfo = packageInfo(filePath, PACKAGES_DIR);
            if (pkgInfo) {
                syncQueue.add(pkgInfo);
                syncDebounced();
            } else {
                const location = categoryFileLocation(filePath, PACKAGES_DIR);
                if (location !== null) {
                    return syncCategoryFile(PACKAGES_DIR, path.join(DEST_ROOT, location));
                }
            }
        })
        .on('ready', () => {
            console.log('Watching for package and Pyodide extension documentation changes...');
        });
};

main().catch((err) => {
    console.error('Error in docs watcher:', err);
    process.exit(1);
});
