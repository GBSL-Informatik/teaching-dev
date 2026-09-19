import { LoadContext, Plugin, PluginModule } from '@docusaurus/types';
import { promises as fs } from 'fs';
import path from 'path';
import { PluginName } from '.';
import { exportDB } from './utils/exportDb';
import { pageIndexPath } from './utils/options';

const isDev = process.env.NODE_ENV !== 'production';

const pageIndexPlugin: PluginModule = (context: LoadContext) => {
    const config: Plugin<{}> = {
        name: PluginName,
        async allContentLoaded() {
            if (isDev) {
                try {
                    await fs.access(path.dirname(pageIndexPath));
                } catch {
                    await fs.mkdir(path.dirname(pageIndexPath), { recursive: true });
                }
            }
        },
        async postBuild() {
            try {
                await fs.access(path.dirname(pageIndexPath));
            } catch {
                await fs.mkdir(path.dirname(pageIndexPath), { recursive: true });
            }

            await exportDB();
        }
    };
    return config as Plugin;
};

export default pageIndexPlugin;
