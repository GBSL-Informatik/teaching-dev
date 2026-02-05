import { DocumentType } from '@tdev-api/document';

export interface PageIndex {
    /**
     * the document root id
     */
    id: string;
    type: DocumentType;
    /**
     * the page_id in the frontmatter of each md/mdx file
     */
    page_id: string;
    /**
     * The resolved path to the file - should be the same
     * as docusaurus `path` field in the sidebar index.
     */
    path: string;
    position: number;
}

export const PluginName = 'page-progress-state';
