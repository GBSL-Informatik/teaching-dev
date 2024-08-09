require('dotenv').config();
import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

import strongPlugin from './src/plugins/remark-strong/plugin';
import deflistPlugin from './src/plugins/remark-deflist/plugin';
import mdiPlugin from './src/plugins/remark-mdi/plugin';
import kbdPlugin from './src/plugins/remark-kbd/plugin';
import defboxPlugin from './src/plugins/remark-code-defbox/plugin';
import flexCardsPlugin from './src/plugins/remark-flex-cards/plugin';
import imagePlugin from './src/plugins/remark-images/plugin';
import mediaPlugin from './src/plugins/remark-media/plugin';

const GIT_COMMIT_SHA = process.env.GITHUB_SHA || Math.random().toString(36).substring(7);

const BEFORE_DEFAULT_REMARK_PLUGINS = [
  flexCardsPlugin,
  [
      imagePlugin,
      { tagNames: { sourceRef: 'SourceRef', figure: 'Figure' } }
  ],
  defboxPlugin
];

const REMARK_PLUGINS = [  
  [strongPlugin, { className: 'boxed' }],
  [
      deflistPlugin,
      {
          tagNames: {
              dl: 'Dl',
          },
      }
  ],
  [
      mdiPlugin,
      {
          colorMapping: {
              green: 'var(--ifm-color-success)',
              red: 'var(--ifm-color-danger)',
              orange: 'var(--ifm-color-warning)',
              yellow: '#edcb5a',
              blue: '#3578e5',
              cyan: '#01f0bc'
          },
          defaultSize: '1.25em'
      }
  ],
  mediaPlugin,
  kbdPlugin
];


const config: Config = {
  title: 'Teaching-Dev',
  tagline: 'Dogfooding Teaching Features',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://teaching-dev.gbsl.website',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'gbsl-informatik', // Usually your GitHub org/user name.
  projectName: 'teaching-dev', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  
  customFields: {
    /** Use Testuser in local dev: set TEST_USERNAME to the test users email adress*/
    TEST_USERNAME: process.env.TEST_USERNAME,
    NO_AUTH: process.env.NODE_ENV !== 'production' && !!process.env.TEST_USERNAME,
    /** The Domain Name where the api is running */
    APP_URL: process.env.NETLIFY 
      ? process.env.DEPLOY_PRIME_URL 
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
},

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'de',
    locales: ['de'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/GBSL-Informatik/teaching-dev/edit/main/',
          remarkPlugins: REMARK_PLUGINS,
          beforeDefaultRemarkPlugins: BEFORE_DEFAULT_REMARK_PLUGINS,
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/GBSL-Informatik/teaching-dev/edit/main/',
            remarkPlugins: REMARK_PLUGINS,
            beforeDefaultRemarkPlugins: BEFORE_DEFAULT_REMARK_PLUGINS,
        },
        pages: {
          remarkPlugins: REMARK_PLUGINS,
          beforeDefaultRemarkPlugins: BEFORE_DEFAULT_REMARK_PLUGINS,
        },
        theme: {
          customCss: './src/css/custom.scss',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/social-card.jpg',
    navbar: {
      title: 'Teaching Dev',
      logo: {
        alt: 'Teaching Dev Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: '/docs/Komponentengalerie',
          label: 'Galerie',
          position: 'left',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://github.com/GBSL-Informatik/teaching-dev',
          label: 'GitHub',
          position: 'right',
        },
        {
            type: 'custom-loginProfileButton',
            position: 'right'
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Galerie',
              to: '/docs/Komponentengalerie',
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
      copyright: `Copyright © ${new Date().getFullYear()} Teaching Dev. Built with Docusaurus. <br />
      <a class="badge badge--primary" href="https://github.com/GBSL-Informatik/teaching-dev/commit/${GIT_COMMIT_SHA}">
            ᚶ ${GIT_COMMIT_SHA.substring(0, 7)}
      </a>
      `,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
  plugins: ['docusaurus-plugin-sass'],
  themes: ['docusaurus-live-brython'],
};

export default config;
