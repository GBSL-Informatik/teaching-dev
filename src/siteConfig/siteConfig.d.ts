import { FooterLinkItem, NavbarItem } from '@docusaurus/theme-common';
import { PluginOptions } from '@docusaurus/types';
import { ConfigTransformer } from './transformers';
import type { DeepPartial, DeepPartialArray } from 'utility-types';
import type { Options as DocsPluginOptions } from '@docusaurus/plugin-content-docs';
import type { Options as BlogPluginOptions } from '@docusaurus/plugin-content-blog';
import type { Options as PagesPluginOptions } from '@docusaurus/plugin-content-pages';

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

    /** The behavior for broken links. */
    onBrokenLinks?: 'throw' | 'ignore' | 'log' | 'warn';

    /** The behavior for markdown broken links. */
    onBrokenMarkdownLinks?: 'throw' | 'ignore' | 'log' | 'warn';

    /** Items to show in the navbar. */
    navbarItems?: NavbarItem[];

    /** The document root ID for the "personal space overlay" file system. */
    personalSpaceDocRootId?: string;

    /**
     * the config of the blog plugin. It will be merged with the default options in docusaurus.config.ts
     * @example ignore the tdev docs (gallery etc.)
     * ```ts
     * blog: {
     *      exclude: ['tdev/**']
     * }
     * ```
     */
    blog?: Omit<BlogPluginOptions, 'id'> | false;

    /** The config of the docs plugin. It will be merged with the default options in docusaurus.config.ts
     * @example ignore the tdev blog posts
     * ```ts
     * docs: {
     *      exclude: ['tdev/**']
     * }
     * ```
     */
    docs?: Omit<DocsPluginOptions, 'id'> | false;

    /**
     * extend th default options of the pages plugin
     * @example add admonition types
     * ```ts
     * pages: {
     *     admonitionTypes: {
     *         keywords: ['aufgabe'],
     *         extendDefaults: true
     *      }
     * }
     * ```
     */
    pages?: Omit<PagesPluginOptions, 'id' | 'path'>;

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

    /** Overrides for the theme config (see https://docusaurus.io/docs/api/themes/configuration). */
    themeConfig?: Preset.ThemeConfig;

    /** List of plugins to be loaded before the default remark plugins. */
    beforeDefaultRemarkPlugins?: PluginOptions[];

    /** List of remark plugins to be loaded. */
    remarkPlugins?: PluginOptions[];

    /** List of rehype plugins to be loaded. */
    rehypePlugins?: PluginOptions[];

    /** docusaurus markdown config */
    markdown?: DeepPartial<MarkdownConfig>;

    /** List of Docusaurus plugins to be loaded. */
    plugins?: PluginOptions[];

    /**
     * An array of scripts to load. The values can be either strings or plain objects of attribute-value maps.
     * The `<script>` tags will be inserted in the HTML `<head>`.
     */
    scripts?: (
        | string
        | {
              [key: string]: string | boolean | undefined;
              src: string;
          }
    )[];

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
