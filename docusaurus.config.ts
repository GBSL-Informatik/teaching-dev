require('dotenv').config();
import getSiteConfig from './siteConfig';
import { themes as prismThemes } from 'prism-react-renderer';
import type { Config, } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import themeCodeEditor from './src/plugins/theme-code-editor'
import { v4 as uuidv4 } from 'uuid';
import matter from 'gray-matter';
import { promises as fs } from 'fs';
import { accountSwitcher, blog, cms, gallery, gitHub, loginProfileButton, requestTarget, taskStateOverview } from './src/siteConfig/navbarItems';
import { applyTransformers } from './src/siteConfig/transformers';
import {
  sassPluginConfig,
  dynamicRouterPluginConfig,
  rsDoctorPluginConfig,
  aliasConfigurationPluginConfig,
  sentryPluginConfig,
  pdfjsCopyDependenciesPluginConfig,
  excalidrawPluginConfig,
  socketIoNoDepWarningsPluginConfig,
} from './src/siteConfig/pluginConfigs';
import { recommendedBeforeDefaultRemarkPlugins, recommendedRehypePlugins, recommendedRemarkPlugins } from './src/siteConfig/markdownPluginConfigs';

const siteConfig = getSiteConfig();

const BUILD_LOCATION = __dirname;
const GIT_COMMIT_SHA = process.env.GITHUB_SHA || Math.random().toString(36).substring(7);
const OFFLINE_API = process.env.OFFLINE_API === 'false' ? false : !!process.env.OFFLINE_API || process.env.CODESPACES === 'true';
const TITLE = siteConfig.title ?? 'Teaching-Dev';

const BEFORE_DEFAULT_REMARK_PLUGINS = siteConfig.beforeDefaultRemarkPlugins ?? recommendedBeforeDefaultRemarkPlugins;
const REMARK_PLUGINS = siteConfig.remarkPlugins ?? recommendedRemarkPlugins;
const REHYPE_PLUGINS = siteConfig.rehypePlugins ?? recommendedRehypePlugins;

const ORGANIZATION_NAME = siteConfig.gitHub?.orgName ?? 'gbsl-informatik';
const PROJECT_NAME = siteConfig.gitHub?.projectName ?? 'teaching-dev';
const TEST_USERNAMES = (process.env.TEST_USERNAMES?.split(';') || []).map((u) => u.trim()).filter(u => !!u);

const config: Config = applyTransformers({
  title: TITLE,
  tagline: siteConfig.tagline ?? 'Dogfooding Teaching Features',
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

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  customFields: {
    /** Use Testuser in local dev: set TEST_USERNAME to the test users email adress*/
    TEST_USERNAMES: TEST_USERNAMES,
    OFFLINE_API: OFFLINE_API,
    /** User.ts#isStudent returns `true` for users matching this pattern. If unset, it returns `true` for all non-admin users. */
    STUDENT_USERNAME_PATTERN: process.env.STUDENT_USERNAME_PATTERN,
    NO_AUTH: (process.env.NODE_ENV !== 'production' || OFFLINE_API) && TEST_USERNAMES.length > 0,
    /** The Domain Name where the api is running */
    APP_URL: process.env.NETLIFY
      ? process.env.CONTEXT === 'production'
        ? process.env.URL
        : process.env.DEPLOY_PRIME_URL
      : process.env.APP_URL || 'http://localhost:3000',
    /** The Domain Name of this app */
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3002',
    /** The application id generated in https://portal.azure.com */
    CLIENT_ID: process.env.CLIENT_ID,
    /** Tenant / Verzeichnis-ID (Mandant) */
    TENANT_ID: process.env.TENANT_ID,
    /** The application id uri generated in https://portal.azure.com */
    API_URI: process.env.API_URI,
    GIT_COMMIT_SHA: GIT_COMMIT_SHA,
    SENTRY_DSN: process.env.SENTRY_DSN
  },
  future: {
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
      mdxCrossCompilerCache: true,
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
    }
  },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Remove this to remove the "edit this page" links.
          editUrl:
            `/cms/${ORGANIZATION_NAME}/${PROJECT_NAME}/`,
          remarkPlugins: REMARK_PLUGINS,
          rehypePlugins: REHYPE_PLUGINS,
          beforeDefaultRemarkPlugins: BEFORE_DEFAULT_REMARK_PLUGINS,
          lastVersion: siteConfig.docs?.lastVersion,
          routeBasePath: siteConfig.docs?.routeBasePath,
          versions: siteConfig.docs?.versions,
        },
        blog: {
          showReadingTime: true,
          // Remove this to remove the "edit this page" links.
          editUrl:
            `/cms/${ORGANIZATION_NAME}/${PROJECT_NAME}/`,
          remarkPlugins: REMARK_PLUGINS,
          rehypePlugins: REHYPE_PLUGINS,
          beforeDefaultRemarkPlugins: BEFORE_DEFAULT_REMARK_PLUGINS,
        },
        pages: {
          id: 'website-pages',
          path: 'website/pages',
          remarkPlugins: REMARK_PLUGINS,
          rehypePlugins: REHYPE_PLUGINS,
          beforeDefaultRemarkPlugins: BEFORE_DEFAULT_REMARK_PLUGINS,
          editUrl: `/cms/${ORGANIZATION_NAME}/${PROJECT_NAME}/`
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
        requestTarget,
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
    algolia: siteConfig.algolia ?? undefined,
  } satisfies Preset.ThemeConfig,
  plugins: [
    sassPluginConfig,
    dynamicRouterPluginConfig,
    rsDoctorPluginConfig,
    aliasConfigurationPluginConfig,
    sentryPluginConfig,
    pdfjsCopyDependenciesPluginConfig,
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
        editUrl: `/cms/${ORGANIZATION_NAME}/${PROJECT_NAME}/`
      },
    ]
  ],
  themes: [
    [
      themeCodeEditor,
      {
        brythonSrc: 'https://cdn.jsdelivr.net/npm/brython@3.13.0/brython.min.js',
        brythonStdlibSrc: 'https://cdn.jsdelivr.net/npm/brython@3.13.0/brython_stdlib.js',
        libDir: '/bry-libs/'
      }
    ]
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
}, siteConfig.transformers ?? {});

export default config;
