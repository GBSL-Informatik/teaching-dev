import { FooterLinkItem, NavbarItem } from '@docusaurus/theme-common';
import { PluginOptions } from '@docusaurus/types';
import { ConfigTransformer } from './transformers';
import type { Options as DocsPluginOptions } from '@docusaurus/plugin-content-docs';
import type { Options as BlogPluginOptions } from '@docusaurus/plugin-content-blog';

export interface SiteConfig {
    /** The title of the site. */
    title?: string;

    /** The tagline of the site. */
    tagline?: string;

    /** The base URL of the site. */
    url?: string;

    /** The `/<baseUrl>/` pathname under which your site is served. For GitHub pages deployment, it is often `/<projectName>/.` */
    baseUrl?: string;

    /** Paths to CSS files to be included in the site. Loaded in order, after custom.scss. */
    siteStyles?: string[];

    /** The path to the favicon of the site (relative to /static). */
    favicon?: string;

    /** The path to the logo of the site (relative to /static). */
    logo?: string;

    /** The path to the social card image (relative to /static). */
    socialCard?: string;

    /** The default locale of the site. */
    defaultLocale?: string;

    /** The locales supported by the site. */
    locales?: string[];

    /** Items to show in the navbar. */
    navbarItems?: NavbarItem[];

    /**
     * the config of the blog plugin. It will be merged with the default options in docusaurus.config.ts
     * @example ignore the tdev docs (gallery etc.)
     * ```ts
     * blog: {
     *      exclude: ['tdev/**']
     * }
     * ```
     */
    blog?: BlogPluginOptions | false;
    /** The config of the docs plugin. It will be merged with the default options in docusaurus.config.ts
     * @example ignore the tdev blog posts
     * ```ts
     * docs: {
     *      exclude: ['tdev/**']
     * }
     * ```
     */
    docs?: DocsPluginOptions | false;
    /** Footer configuration */
    footer?: {
        /** The style of the footer. */
        style?: 'dark' | 'light';

        /** Links to show in the navbar. */
        links?: {
            /** The title of the link group. */
            title?: string;

            /** The items in the link group. */
            items?: FooterLinkItem[];
        }[];

        /** The copyright text to be displayed in the footer. */
        copyright?: string;
    };

    /** Prism theme configuration. */
    prism?: {
        /** The default (light) Prism theme to use. */
        theme?: PrismTheme;

        /** The dark Prism theme to be used. */
        darkTheme?: PrismTheme;

        /** Additional languages for code syntax hightlighting. */
        additionalLanguages?: string[]; //
    };

    /** List of plugins to be loaded before the default remark plugins. */
    beforeDefaultRemarkPlugins?: PluginOptions[];

    /** List of remark plugins to be loaded. */
    remarkPlugins?: PluginOptions[];

    /** List of rehype plugins to be loaded. */
    rehypePlugins?: PluginOptions[];

    /** List of Docusaurus plugins to be loaded. */
    plugins?: PluginOptions[];

    /** GitHub coordinates for your project. */
    gitHub?: {
        /** The name of the GitHub user / organization. */
        orgName?: string;

        /** The name of the GitHub project. */
        projectName?: string;
    };

    /** Transformer functions for the Docusaurus config object. */
    transformers?: ConfigTransformer;
}

export type SiteConfigProvider = () => SiteConfig;
