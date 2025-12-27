import chokidar from 'chokidar';
import minimist from 'minimist';
import path from 'path';
import { getDebouncedSyncer, packageInfo } from './actions';
import packageDocsSync from '.';

const argv = minimist(process.argv.slice(2), {
    string: ['src', 'dest'],
    alias: { src: 'packages', dest: 'out' },
    default: {
        src: 'packages'
    }
});

const PACKAGES_DIR = path.resolve(process.cwd(), argv.src);
const DEST_ROOT = path.resolve(process.cwd(), argv.dest);

const watcher = chokidar.watch(PACKAGES_DIR, { ignoreInitial: true, persistent: true });

const main = async () => {
    const { syncQueue, syncDebounced } = await getDebouncedSyncer(PACKAGES_DIR, DEST_ROOT);
    const NODE_MODULES_TEST = /node_modules/;
    await packageDocsSync(PACKAGES_DIR, DEST_ROOT);

    watcher
        .on('all', async (_event, filePath) => {
            if (NODE_MODULES_TEST.test(filePath)) {
                return null;
            }
            const pkgInfo = packageInfo(filePath, PACKAGES_DIR);
            if (pkgInfo === null) {
                return null;
            }

            syncQueue.add(pkgInfo);
            await syncDebounced();
        })
        .on('ready', () => {
            console.log('Watching for docs changes in packages...');
        });
};

main().catch((err) => {
    console.error('Error in docs watcher:', err);
    process.exit(1);
});
