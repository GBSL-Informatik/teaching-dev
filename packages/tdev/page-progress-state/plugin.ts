import { LoadContext, Plugin, PluginModule } from '@docusaurus/types';
import { exportDB, getContent } from './utils/exportDb';
import path from 'path';
import { promises as fs } from 'fs';
import { PluginName } from '.';
import { pageIndexPath } from './utils/options';

const isDev = process.env.NODE_ENV !== 'production';

const persistableDocuments: PluginModule = (context: LoadContext) => {
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

export default persistableDocuments;
