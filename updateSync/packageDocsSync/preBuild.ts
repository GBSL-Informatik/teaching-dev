import path from 'path';
import minimist from 'minimist';
import packageDocsSync from '.';
const argv = minimist(process.argv.slice(2), {
    string: ['src', 'dest'],
    alias: { src: 'packages', dest: 'out' },
    default: {
        src: 'packages'
    }
});
const CWD = process.cwd();
const { src, dest } = argv;

const PACKAGES_DIR = path.resolve(CWD, src);
const DEST_ROOT = path.resolve(CWD, dest);

const main = async () => {
    await packageDocsSync(PACKAGES_DIR, DEST_ROOT);
    console.log('✅ Pre-build docs sync completed.');
};

main().catch((err) => {
    console.error('Error in docs watcher:', err);
    process.exit(1);
});
