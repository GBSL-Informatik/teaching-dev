import { execa } from 'execa';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MigrationRunner } from '../src/constants';
import { pathExists } from '../src/helpers/base';
import { filesContainingMatch } from '../src/helpers/filesContainingMatch';
import { applySearchAndReplace, searchAndReplace } from '../src/helpers/searchAndReplace';
import shellInput from '../src/helpers/shellInput';
import writeFile from '../src/helpers/writeFile';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tdevRoot = path.join(__dirname, '..', '..', '..', '..');

interface MigrationFile {
    path: string;
    content: string;
    write: () => Promise<void>;
}

const DefaultSiteStore = `import { RootStore } from '@tdev-stores/rootStore';
import { ToolsStore } from './ToolsStore';

export default class SiteStore {
    toolsStore: ToolsStore;

    constructor(root: RootStore) {
        this.toolsStore = new ToolsStore(root);
    }
}
`;

const migrate: MigrationRunner = async (root, name, ts, conf, argv): Promise<void> => {
    const $ = execa({ cwd: root, stdio: 'inherit' });
    const branchName = `migrate-${name}`;
    await $`git checkout -b ${branchName}`;
    await $`yarn run updateTdev`;
    await $`yarn install`;
    if (await pathExists(path.join(root, 'website/packages/pyodide-code'))) {
        await $`rm -rf ${path.join(root, 'website/packages/pyodide-code')}`;
    }
    if (await pathExists(path.join(root, 'website/stores/ToolsStore/ClockStore.ts'))) {
        await $`rm ${path.join(root, 'website/stores/ToolsStore/ClockStore.ts')}`;
    }
    if (await pathExists(path.join(root, 'website/stores/ToolsStore/LedStore.ts'))) {
        await $`rm ${path.join(root, 'website/stores/ToolsStore/LedStore.ts')}`;
    }
    const siteStorePath = path.join(root, 'website/stores/SiteStore.ts');
    if (await pathExists(siteStorePath)) {
        const currentContent = await readFile(siteStorePath, 'utf8');
        await writeFile(path.join(root, 'website/stores/SiteStore.ts'), DefaultSiteStore);
        console.log(`Replaced ${siteStorePath} with default SiteStore.ts content.`);
        console.log('Previous content was:');
        console.log(currentContent);
    }
    // rsync from tdev-website/website/pyodide to website/packages/pyodide-code. leave comment for each rsync flag
    // -a: archive mode, preserves permissions, timestamps, and other attributes
    // -v: verbose output
    // -u: update only, don't overwrite newer files
    await $`rsync -avu ${tdevRoot}/tdev-website/website/pyodide/ website/pyodide/`;

    // copy from hfr's tdev website the lef_control
    if (argv.hfr) {
        const hfrLed = path.join(argv.hfr, 'website/pyodide/led_control/');
        await $`rsync -avu ${hfrLed} website/pyodide/led_control/`;
        const hfrTryClock = path.join(
            argv.hfr,
            'docs/OF-Programmieren-1/16-modulo/components/TryUserClock.tsx'
        );
        const thisTryClock = path.join(root, 'docs/OF-Programmieren-1/16-modulo/components/TryUserClock.tsx');
        if (await pathExists(thisTryClock)) {
            await $`cp ${hfrTryClock} ${thisTryClock}`;
        }
    }

    await searchAndReplace(path.join(root, 'siteConfig.ts'), [
        {
            pattern: /brythonCodePluginConfig\(\)/,
            replacement: `brythonCodePluginConfig(),
            [
                require.resolve('@tdev/pyodide-code/plugin'),
                {
                    extensions: [
                        path.join(__dirname, 'website/pyodide/clock')
                    ]
                } satisfies PyodidePluginOptions
            ]`
        },
        {
            pattern: /\nconst GIT_COMMIT_SHA/,
            replacement: `import type { PluginOptions as PyodidePluginOptions } from '@tdev/pyodide-code/plugin';
import path from 'node:path';

const GIT_COMMIT_SHA`
        }
    ]);

    const files = await filesContainingMatch(root, '@tdev/pyodide-code/components/Clock');
    await applySearchAndReplace(files, [
        {
            pattern: '@tdev/pyodide-code/components/Clock',
            replacement: '@tdev/pyodide/clock/src/components/Clock'
        }
    ]);
    if (await pathExists(path.join(root, 'website/stores/ToolsStore/index.ts'))) {
        await searchAndReplace(path.join(root, 'website/stores/ToolsStore/index.ts'), [
            {
                pattern: `import ClockStore from '\\./ClockStore';`,
                replacement: ''
            },
            {
                pattern: `import LedStore from './LedStore';`,
                replacement: ''
            },
            {
                pattern: /@observableRef accessor clockStore = new ClockStore\(\);/,
                replacement: ''
            },
            {
                pattern: /@observableRef accessor ledStore = new LedStore\(\);/,
                replacement: ''
            }
        ]);
    }
    await $`yarn run format`;
    const res = await shellInput(
        'Zusätzliche Änderungen notwendig? Durchführen und danach mit Enter bestätigen.'
    );

    await $`git add .`;
    await $`git commit -m ${'[tdev] Update pyodide package and plugin system\n\nhttps://github.com/GBSL-Informatik/teaching-dev/pull/354'}`;
    await $`git checkout main`;
    await $`git merge ${branchName}`;
    await $`git branch -d ${branchName}`;
};

export default migrate;
