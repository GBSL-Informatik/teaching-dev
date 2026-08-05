import { MigrationRunner } from '../src/constants';
import { packageJson, updateTdevConfig } from '../src/helpers/loadFile';
import { execa } from 'execa';
import { writePackageJson, writeUpdateTdevConfig } from '../src/helpers/writeFile';
import { ensureTdevConfig, modifyPackages } from '../src/helpers/actions';

const migrate: MigrationRunner = async (root, name): Promise<void> => {
    const $ = execa({ stdio: 'inherit' });

    const branchName = `migrate-${name}`;
    await $`git checkout -b ${branchName}`;

    // updateTdev.config.yaml
    const updateConfig = await updateTdevConfig(root);
    await $`rm -f tsconfig.tdev.json`;
    ensureTdevConfig(updateConfig, [
        {
            src: 'tsconfig.tdev.json',
            dst: 'tsconfig.json'
        },
        {
            src: 'tsconfig.docusaurus.json',
            dst: 'tsconfig.docusaurus.json'
        },
        {
            src: 'static/bry-libs/',
            dst: 'static/bry-libs'
        },
        {
            src: 'static/pyodide.sw.js',
            dst: 'static/pyodide.sw.js'
        },
        {
            src: 'static/tdev-artifacts/',
            dst: 'static/tdev-artifacts/',
            ignore: ['*/**']
        }
    ]);
    await $`rm -f tsconfig.tdev.json`;
    await writeUpdateTdevConfig(root, updateConfig);
    await $`yarn run updateTdev`;

    // package.json
    const pkg = await packageJson(root);
    modifyPackages(
        pkg,
        {
            dependencies: {
                '@sentry/react': '^10.64.0',
                'better-auth': '^1.6.23',
                'react-draggable': '4.5.0',
                dotenv: '^17.4.2',
                'es-toolkit': '^1.49.0',
                hashery: '^3.0.0',
                'js-yaml': '^5.2.1',
                sass: '^1.101.0',
                uuid: '^14.0.1'
            },
            devDependencies: {
                '@vitest/coverage-v8': '^4.1.10',
                concurrently: '^10.0.3',
                typescript: '^7.0.2',
                vitest: '^4.1.10',
                'fs-extra': '^11.3.6',
                prettier: '^3.9.4'
            }
        },
        ['@mdxeditor/editor', '@octokit/rest', '@lexical/*']
    );
    await writePackageJson(root, pkg);
    await $`rm -rf node_modules`;
    await $`rm yarn.lock`;
    await $`yarn install`;
    await $`yarn format`;

    await $`git add .`;
    await $`git commit -m ${'[tdev] Migrate TDEV'}`;
    await $`git checkout main`;
    await $`git merge ${branchName}`;
    await $`git branch -d ${branchName}`;
    await $`git push`;
};

export default migrate;
