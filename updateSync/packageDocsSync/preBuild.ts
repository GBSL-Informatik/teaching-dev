require('dotenv').config();
import path from 'path';
import minimist from 'minimist';
const argv = minimist(process.argv.slice(2), {
    string: ['src', 'dest'],
    alias: { src: 'packages', dest: 'out' },
    default: {
        src: 'packages'
    }
});

const main = async () => {
    // const DOCS_PATH = useTdevContentPath(siteConfig, 'docs');
    // await packageDocsSync(PACKAGES_DIR, DEST_ROOT);
};

main().catch((err) => {
    console.error('Error in docs watcher:', err);
    process.exit(1);
});
