import type { SiteConfig } from './siteConfig';
import path from 'path';

export const withSiteConfig = async (): Promise<SiteConfig> => {
    if (process.env.SITE_CONFIG_PATH) {
        console.log(`Using site config from ${process.env.SITE_CONFIG_PATH}`);
        const pathToConfig = path.resolve(process.cwd(), process.env.SITE_CONFIG_PATH);
        const getConfig = await import(pathToConfig).then((mod) => mod.default);
        return getConfig();
    } else {
        console.log(`Using site config from default './siteConfig'`);
        const pathToConfig = path.resolve(process.cwd(), 'siteConfig');
        const getConfig = await import(pathToConfig).then((mod) => mod.default);
        return getConfig();
    }
};
