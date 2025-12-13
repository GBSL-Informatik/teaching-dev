require('dotenv').config();
import getSiteConfig from './siteConfig';
import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import themeCodeEditor from './src/plugins/theme-code-editor'
import { v4 as uuidv4 } from 'uuid';
import matter from 'gray-matter';
import { promises as fs } from 'fs';
import { accountSwitcher, blog, cms, devModeAccessLocalFS, gallery, gitHub, loginProfileButton, personalSpaceOverlay, requestTarget, taskStateOverview } from './src/siteConfig/navbarItems';
import { applyTransformers } from './src/siteConfig/transformers';
import {
  sassPluginConfig,
  dynamicRouterPluginConfig,
  rsDoctorPluginConfig,
  aliasConfigurationPluginConfig,
  sentryPluginConfig,
  socketIoNoDepWarningsPluginConfig,
} from './src/siteConfig/pluginConfigs';
import { useTdevContentPath } from './src/siteConfig/helpers';
import path from 'path';
import { recommendedBeforeDefaultRemarkPlugins, recommendedRehypePlugins, recommendedRemarkPlugins } from './src/siteConfig/markdownPluginConfigs';
import { remarkPdfPluginConfig } from '@tdev/remark-pdf';
import { excalidrawPluginConfig } from '@tdev/excalidoc';
import type { EditThisPageOption, ShowEditThisPage, TdevConfig } from '@tdev/siteConfig/siteConfig';
import onNewExcalidrawSketch from '@tdev/excalidoc/ImageMarkupEditor/onNewExcalidrawSketch';

const siteConfig = getSiteConfig();

const BUILD_LOCATION = __dirname;
const GIT_COMMIT_SHA = process.env.GITHUB_SHA || Math.random().toString(36).substring(7);
const OFFLINE_API = process.env.OFFLINE_API === 'false' 
  ? false
  : process.env.OFFLINE_API === 'indexedDB'
      ? 'indexedDB'
      : !!process.env.OFFLINE_API || process.env.CODESPACES === 'true';

      const TITLE = siteConfig.title ?? 'Teaching-Dev';

const DOCS_PATH = useTdevContentPath(siteConfig, 'docs');
const BLOG_PATH = useTdevContentPath(siteConfig, 'blog');

const BEFORE_DEFAULT_REMARK_PLUGINS = siteConfig.beforeDefaultRemarkPlugins ?? recommendedBeforeDefaultRemarkPlugins;
const REMARK_PLUGINS = siteConfig.remarkPlugins ?? recommendedRemarkPlugins;
const REHYPE_PLUGINS = siteConfig.rehypePlugins ?? recommendedRehypePlugins;

const ORGANIZATION_NAME = siteConfig.gitHub?.orgName ?? 'gbsl-informatik';
const PROJECT_NAME = siteConfig.gitHub?.projectName ?? 'teaching-dev';
const GH_OAUTH_CLIENT_ID = process.env.GH_OAUTH_CLIENT_ID;
const DEFAULT_TEST_USER = process.env.DEFAULT_TEST_USER?.trim();

const DEFAULT_ADMONITION_CONFIG = {
    admonitions: {
        keywords: ['aufgabe', 'finding', 'insight', 'definition'],
        extendDefaults: true
    }
};

const config: Config = applyTransformers({
  title: TITLE,
  tagline: siteConfig.tagline ?? 'Eine Plattform zur Gestaltung interaktiver Lernerlebnisse',
  favicon: siteConfig.favicon ?? 'img/favicon.ico',

  // Set the production url of your site here
  url: siteConfig.url ?? 'https://teaching-dev.gbsl.website',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: siteConfig.baseUrl ?? '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: ORGANIZATION_NAME, // Usually your GitHub org/user name.
  projectName: PROJECT_NAME, // Usually your repo name.

  onBrokenLinks: siteConfig.onBrokenLinks ?? 'throw',

  customFields: {
    /** Use test user in local dev: set DEFAULT_TEST_USER to the default test users email adress*/
    TEST_USER: DEFAULT_TEST_USER,
    OFFLINE_API: OFFLINE_API,
    NO_AUTH: (process.env.NODE_ENV !== 'production' && !!DEFAULT_TEST_USER) || OFFLINE_API,
    /** The Domain Name where the api is running */
    APP_URL: process.env.NETLIFY
      ? process.env.CONTEXT === 'production'
        ? process.env.URL
        : process.env.DEPLOY_PRIME_URL
      : process.env.APP_URL || 'http://localhost:3000',
    /** The Domain Name of this app */
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3002',
    GIT_COMMIT_SHA: GIT_COMMIT_SHA,
    SENTRY_DSN: process.env.SENTRY_DSN,
    GH_OAUTH_CLIENT_ID: GH_OAUTH_CLIENT_ID,
    PERSONAL_SPACE_DOC_ROOT_ID: siteConfig.personalSpaceDocRootId || '2686fc4e-10e7-4288-bf41-e6175e489b8e',
    showEditThisPage: siteConfig.showEditThisPage ?? 'always' satisfies ShowEditThisPage,
    showEditThisPageOptions: siteConfig.showEditThisPageOptions ?? ['github', 'github-dev', 'cms'] satisfies EditThisPageOption[],
    editThisPageCmsUrl: siteConfig.editThisPageCmsUrl ?? '/cms/',
    tdevConfig: siteConfig.tdevConfig ?? {} satisfies Partial<TdevConfig>,
  },
  future: {
    v4: true,
    experimental_faster: {
        /**
         * no config options for swcJsLoader so far. 
         * Instead configure it over the jsLoader in the next step 
         */
        swcJsLoader: false,
        swcJsMinimizer: true,
        swcHtmlMinimizer: true,
        lightningCssMinimizer: true,
        rspackBundler: true,
        rspackPersistentCache: process.env.NETLIFY ? false : true,
        mdxCrossCompilerCache: true,
        ssgWorkerThreads: true,
      },
  },
  webpack: {
    jsLoader: (isServer) => {
        const defaultOptions = require("@docusaurus/faster").getSwcLoaderOptions({ isServer });
        return {
          loader: 'builtin:swc-loader', // (only works with Rspack)
          options: {
            ...defaultOptions,
            jsc: {
              parser: {
                ...defaultOptions.jsc.parser,
                decorators: true
              },
              transform: {
                ...defaultOptions.jsc.transform,
                decoratorVersion: '2022-03',
              }
            },
          },
        }
      },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: siteConfig.defaultLocale ?? 'de',
    locales: siteConfig.locales ?? ['de'],
  },
  markdown: {
    parseFrontMatter: async (params) => {
      const result = await params.defaultParseFrontMatter(params);
      if (process.env.NODE_ENV === 'production') {
        return result;
      }
      /**
       * don't add frontmatter to partials
       */
      const fileName = path.basename(params.filePath);
      if (fileName.startsWith('_')) {
        // it is a partial, don't add frontmatter
        return result;
      }
      /**
       * don't edit blogs frontmatter
       */
      if (params.filePath.startsWith(`${BUILD_LOCATION}/blog/`)) {
        return result;
      }
      if (process.env.NODE_ENV !== 'production') {
        let needsRewrite = false;
        /**
         * material on ofi.gbsl.website used to have 'sidebar_custom_props.id' as the page id.
         * Rewrite it as 'page_id' and remove it in case it's present.
         */
        if ('sidebar_custom_props' in result.frontMatter && 'id' in (result.frontMatter as any).sidebar_custom_props) {
          if (!('page_id' in result.frontMatter)) {
            result.frontMatter.page_id = (result.frontMatter as any).sidebar_custom_props.id;
            needsRewrite = true;
          }
          delete (result.frontMatter as any).sidebar_custom_props.id;
          if (Object.keys((result.frontMatter as any).sidebar_custom_props).length === 0) {
            delete result.frontMatter.sidebar_custom_props;
          }
        }
        if (!('page_id' in result.frontMatter)) {
          result.frontMatter.page_id = uuidv4();
          needsRewrite = true;
        }
        if (needsRewrite) {
          await fs.writeFile(
            params.filePath,
            matter.stringify(params.fileContent, result.frontMatter),
            { encoding: 'utf-8' }
          )
        }
      }
      return result;
    },
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: siteConfig.onBrokenMarkdownLinks ?? 'warn',
      onBrokenMarkdownImages: process.env.NODE_ENV === 'production' 
        ? siteConfig.onBrokenImages ?? 'throw' 
        : onNewExcalidrawSketch
    },
    ...siteConfig.markdown
  },
  presets: [
    [
      'classic',
      {
        docs: DOCS_PATH ? {
          sidebarPath: './sidebars.ts',
          // Remove this to remove the "edit this page" links.
          path: DOCS_PATH,
          editUrl: '/',
          remarkPlugins: REMARK_PLUGINS,
          rehypePlugins: REHYPE_PLUGINS,
          beforeDefaultRemarkPlugins: BEFORE_DEFAULT_REMARK_PLUGINS,
          ...DEFAULT_ADMONITION_CONFIG,
          ...(siteConfig.docs || {})
        } : false,
        blog: BLOG_PATH ? {
          path: BLOG_PATH,
          showReadingTime: true,
          // Remove this to remove the "edit this page" links.
          editUrl: '/',
          remarkPlugins: REMARK_PLUGINS,
          rehypePlugins: REHYPE_PLUGINS,
          beforeDefaultRemarkPlugins: BEFORE_DEFAULT_REMARK_PLUGINS,
          ...DEFAULT_ADMONITION_CONFIG,
          ...(siteConfig.blog || {})
        } : false,
        pages: {
          id: 'website-pages',
          path: 'website/pages',
          remarkPlugins: REMARK_PLUGINS,
          rehypePlugins: REHYPE_PLUGINS,
          beforeDefaultRemarkPlugins: BEFORE_DEFAULT_REMARK_PLUGINS,
          editUrl: '/',
          ...DEFAULT_ADMONITION_CONFIG,
          ...(siteConfig.pages || {})
        },
        theme: {
          customCss: siteConfig.siteStyles ? ['./src/css/custom.scss', ...siteConfig.siteStyles] : './src/css/custom.scss',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    image: siteConfig.socialCard ?? 'img/social-card.jpg',
    navbar: {
      title: TITLE,
      logo: {
        alt: `${TITLE} Logo`,
        src: siteConfig.logo ?? 'img/logo.svg',
      },
      items: siteConfig.navbarItems ?? [
        gallery,
        blog,
        cms,
        gitHub,
        taskStateOverview,
        accountSwitcher,
        devModeAccessLocalFS,
        requestTarget,
        personalSpaceOverlay,
        loginProfileButton,
      ],
    },
    footer: {
      style: siteConfig.footer?.style ?? 'dark',
      links: siteConfig.footer?.links ?? [
        {
          title: 'Docs',
          items: [
            {
              label: 'Galerie',
              to: '/docs/gallery',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
          ],
        },
      ],
      copyright: siteConfig.footer?.copyright ?? `Copyright © ${new Date().getFullYear()} Teaching Dev. Built with Docusaurus. <br />
      <a class="badge badge--primary" href="https://github.com/GBSL-Informatik/teaching-dev/commits/${GIT_COMMIT_SHA}">
            ᚶ ${GIT_COMMIT_SHA.substring(0, 7)}
      </a>
      `,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'typescript', 'json', 'python'],
    },
    ...(siteConfig.themeConfig || {}),
  } satisfies Preset.ThemeConfig,
  plugins: [
    sassPluginConfig,
    dynamicRouterPluginConfig,
    rsDoctorPluginConfig,
    aliasConfigurationPluginConfig,
    sentryPluginConfig,
    remarkPdfPluginConfig,
    excalidrawPluginConfig,
    socketIoNoDepWarningsPluginConfig,
    [
      '@docusaurus/plugin-content-pages',
      {
        id: 'tdev-pages',
        path: 'src/pages',
        remarkPlugins: REMARK_PLUGINS,
        rehypePlugins: REHYPE_PLUGINS,
        beforeDefaultRemarkPlugins: BEFORE_DEFAULT_REMARK_PLUGINS,
        editUrl: `/cms/${ORGANIZATION_NAME}/${PROJECT_NAME}/`,
          ...(siteConfig.pages || {})
      },
    ]
  ],
  themes: [
    '@docusaurus/theme-mermaid',
    [
      themeCodeEditor,
      {
        brythonSrc: 'https://cdn.jsdelivr.net/npm/brython@3.13.2/brython.min.js',
        brythonStdlibSrc: 'https://cdn.jsdelivr.net/npm/brython@3.13.2/brython_stdlib.js',
        libDir: '/bry-libs/'
      }
    ],
    ...(siteConfig.themes || [])
  ],
  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
      type: 'text/css',
      integrity:
        'sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM',
      crossorigin: 'anonymous',
    },
  ],
  clientModules: [
    require.resolve('@tdev/excalidoc/register'),
    require.resolve('@tdev/netpbm-graphic/register')
  ],
  scripts: siteConfig.scripts,
}, siteConfig.transformers ?? {});

export default config;
