import chokidar from 'chokidar';
import minimist from 'minimist';
import path from 'path';
import { getDebouncedSyncer, META_FILES_TEST } from '.';

const argv = minimist(process.argv.slice(2), {
    string: ['src', 'dest'],
    alias: { src: 'packages', dest: 'out' },
    default: {
        src: 'packages'
    }
});

const PACKAGES_DIR = path.resolve(process.cwd(), argv.src);
const DEST_ROOT = path.resolve(process.cwd(), argv.dest);

const watcher = chokidar.watch(PACKAGES_DIR, { ignoreInitial: false, persistent: true });

const { syncQueue, syncDebounced } = getDebouncedSyncer(PACKAGES_DIR, DEST_ROOT);

const NODE_MODULES_TEST = /node_modules/;
const DOCS_PATH_TEST = new RegExp(`${path.sep}docs${path.sep}|${path.sep}docs$`);

watcher
    .on('all', (_event, filePath) => {
        if (NODE_MODULES_TEST.test(filePath)) {
            return null;
        }

        if (DOCS_PATH_TEST.test(filePath) || META_FILES_TEST.test(filePath)) {
            syncQueue.add(filePath);
            syncDebounced();
        }
    })
    .on('ready', () => {
        console.log('Initial scan complete. Watching for docs changes...');
    });
