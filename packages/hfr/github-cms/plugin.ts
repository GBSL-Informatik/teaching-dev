import { PluginConfig } from '@docusaurus/types';
import { SiteConfig } from '@tdev/siteConfig/siteConfig';
import type { Pluggable } from 'unified';

const githubCmsPlugin = (options: {
    pages: SiteConfig['pages'];
    remarkPlugins: Pluggable[];
    rehypePlugins: Pluggable[];
    beforeDefaultRemarkPlugins: Pluggable[];
}): PluginConfig => {
    return [
        '@docusaurus/plugin-content-pages',
        {
            id: 'tdev-github-cms-pages',
            path: './packages/hfr/github-cms/pages',
            remarkPlugins: options.remarkPlugins,
            rehypePlugins: options.rehypePlugins,
            beforeDefaultRemarkPlugins: options.beforeDefaultRemarkPlugins,
            editUrl: `/`,
            ...options.pages
        }
    ];
};

export default githubCmsPlugin;
