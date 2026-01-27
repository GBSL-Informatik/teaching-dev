import path from 'path';
import { PluginName } from '..';

// current file's directory:
export const pluginRootDir = path.dirname(new URL(import.meta.url).pathname);
export const assetDir = path.join(pluginRootDir, 'assets');

const projectRoot = process.cwd();
const isDev = process.env.NODE_ENV !== 'production';

export const generatedDbDir = path.join(projectRoot, '.docusaurus', PluginName, 'default');

export const generatedDataDir = isDev
    ? path.join(projectRoot, 'static/tdev-artifacts', PluginName)
    : path.join(projectRoot, 'build/tdev-artifacts', PluginName);

export const dbPath = path.join(generatedDbDir, 'index.db');
export const pageIndexPath = path.join(generatedDataDir, 'pageIndex.json');
