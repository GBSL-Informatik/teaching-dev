/**
 * The directives handled by the remark plugins of `src/siteConfig/markdownPluginConfigs.ts`.
 * The admonitions are not listed, they are read from the docusaurus config.
 */

/** `:::details`, `:::cards`, `:::flex`, `:::dd` (deflist), `:::tree` (file trees), `:::def` (code defbox) */
export const CONTAINER_DIRECTIVES = ['details', 'cards', 'flex', 'dd', 'tree', 'def'];

/** their remark plugins ignore a label (`:::cards[Titel]`), unlike `:::details` and `:::def` */
export const CONTAINER_DIRECTIVES_WITHOUT_LABEL = ['cards', 'flex', 'dd', 'tree'];

/** `::br` (cards and flex), the media embeds of `remark-media` and `::pdf` */
export const LEAF_DIRECTIVES = [
    'br',
    'video',
    'audio',
    'youtube',
    'circuitverse',
    'learningapps',
    'codepen',
    'pdf'
];

/** `:mdi[icon-name]` */
export const TEXT_DIRECTIVES = ['mdi'];
