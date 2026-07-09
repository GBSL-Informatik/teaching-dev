import { PluginConfig } from '@docusaurus/types';
import { SiteConfig } from '@tdev/siteConfig/siteConfig';

const githubCmsPlugin = (options: {
    pages: SiteConfig['pages'];
    remarkPlugins: any[];
    rehypePlugins: any[];
    beforeDefaultRemarkPlugins: any[];
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
