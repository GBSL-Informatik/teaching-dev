import { execa } from 'execa';
import path from 'node:path';
import { MigrationRunner } from '../src/constants';
import { modifyPackages } from '../src/helpers/actions';
import { packageJson } from '../src/helpers/loadFile';
import { writePackageJson } from '../src/helpers/writeFile';

const migrate: MigrationRunner = async (root, name): Promise<void> => {
    const $ = execa({ stdio: 'inherit' });

    const branchName = `migrate-${name}`;
    await $`git checkout -b ${branchName}`;

    const pkgBrython = await packageJson(path.join(root, 'packages/tdev/brython-code'));
    modifyPackages(pkgBrython, {
        dependencies: {
            'svg-parser': '^2.1.0'
        }
    });
    await writePackageJson(path.join(root, 'packages/tdev/brython-code'), pkgBrython);

    const pkgExcalidoc = await packageJson(path.join(root, 'packages/tdev/excalidoc'));
    modifyPackages(pkgExcalidoc, {
        dependencies: {
            '@excalidraw/excalidraw': '^0.18.1'
        }
    });
    await writePackageJson(path.join(root, 'packages/tdev/excalidoc'), pkgExcalidoc);

    const pkgMatSync = await packageJson(path.join(root, 'packages/tdev/material-sync'));
    modifyPackages(pkgMatSync, {
        devDependencies: {
            '@types/node': '^26.6.5',
            execa: '^10.2.0',
            'js-yaml': '^5.5.0',
            tsx: '^4.23.15'
        }
    });
    await writePackageJson(path.join(root, 'packages/tdev/material-sync'), pkgMatSync);

    const pkgMigrateTdev = await packageJson(path.join(root, 'packages/tdev/migrate-tdev'));
    modifyPackages(pkgMigrateTdev, {
        devDependencies: {
            '@types/node': '^26.6.5',
            execa: '^10.2.0',
            'js-yaml': '^5.5.0',
            tsx: '^4.23.15'
        }
    });
    await writePackageJson(path.join(root, 'packages/tdev/migrate-tdev'), pkgMigrateTdev);

    const pkgPageIndex = await packageJson(path.join(root, 'packages/tdev/page-index'));
    modifyPackages(pkgPageIndex, {
        devDependencies: {
            '@types/better-sqlite3': '^9.6.0',
            'better-sqlite3': '^13.0.3'
        }
    });
    await writePackageJson(path.join(root, 'packages/tdev/page-index'), pkgPageIndex);

    // package.json
    const pkg = await packageJson(root);
    modifyPackages(pkg, {
        scripts: {
            test: 'vitest --coverage --configLoader runner'
        },
        dependencies: {
            '@mermaid-js/layout-elk': '^1.0.1',
            'ace-builds': '^1.45.0',
            axios: '^1.20.0',
            'better-auth': '^1.7.11',
            dotenv: '^18.0.8',
            'es-toolkit': '^1.52.0',
            hashery: '^3.0.5',
            idb: '^8.0.4',
            'js-yaml': '^5.5.0',
            mobx: '^7.1.1',
            'mobx-react-lite': '^5.1.0',
            react: '^19.3.1',
            'react-diff-viewer-continued': '^4.4.0',
            'react-dom': '^19.3.1',
            'react-draggable': '4.7.2',
            sass: '^1.105.2',
            'socket.io-client': '^4.8.4',
            uuid: '^14.0.3'
        },
        devDependencies: {
            '@types/node': '^26.6.5',
            '@types/react-dom': '^19.3.0',
            '@vitest/coverage-v8': '^5.0.5',
            concurrently: '^10.0.6',
            esbuild: '^0.28.2',
            'fs-extra': '^11.4.1',
            prettier: '^3.9.10',
            tsx: '^4.23.15',
            vite: '^8.3.0',
            vitest: '^5.0.5'
        }
    });
    await writePackageJson(root, pkg);

    await $`yarn install`;

    await $`yarn run updateTdev`;

    await $`git add .`;
    await $`git commit -m ${'[tdev] Update deps and cleanup mobx usage\n\nhttps://github.com/GBSL-Informatik/teaching-dev/pull/336'}`;
    await $`git checkout main`;
    await $`git merge ${branchName}`;
    await $`git branch -d ${branchName}`;
    await $`git push`;
};

export default migrate;
