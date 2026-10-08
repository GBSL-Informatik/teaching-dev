import {
    mdiCodeJson,
    mdiFeather,
    mdiFileCode,
    mdiLanguageCss3,
    mdiLanguageHtml5,
    mdiLanguageJavascript,
    mdiLanguageMarkdownOutline,
    mdiLanguageTypescript,
    mdiSvg
} from '@mdi/js';
import type { DocumentType, TypeDataMapping } from '@tdev-api/document';
import { mdiLanguageYaml } from '@tdev-components/shared/mdiExtension';
import {
    DefaultHtmlCode,
    DefaultJsonCode,
    DefaultQuillDelta,
    DefaultSvgCode,
    DefaultYamlCode
} from '@tdev-stores/assets/DefaultFileContent';

export interface FileConfig<T extends DocumentType> {
    extension: string;
    name?: string;
    description?: string;
    icon?: string;
    iconColor?: string;
    hide?: boolean;
    priority?: number;
    defaultData: TypeDataMapping[T];
}

export const DefaultExtensions: Partial<{ [K in DocumentType]: FileConfig<K>[] }> = {
    code: [
        {
            extension: '',
            name: 'Code',
            description: 'Code-Editor für .svg, .html, .js, .ts, .css, .md und weitere',
            icon: mdiFileCode,
            iconColor: 'light-dark(#13a500, #2ecc71)',
            priority: 10,
            defaultData: {
                code: ''
            }
        },
        {
            extension: '.html',
            name: 'HTML',
            description: 'Für Webseiten',
            icon: mdiLanguageHtml5,
            iconColor: 'light-dark(#a81414, #ff6b6b)',
            hide: true,
            priority: 10,
            defaultData: {
                code: DefaultHtmlCode
            }
        },
        {
            extension: '.svg',
            name: 'SVG',
            description: 'Scalable Vector Graphics',
            priority: 10,
            icon: mdiSvg,
            hide: true,
            iconColor: 'light-dark(#2d27c4, #5a55ff)',
            defaultData: { code: DefaultSvgCode }
        },
        {
            extension: '.md',
            name: 'Markdown',
            hide: true,
            priority: 10,
            icon: mdiLanguageMarkdownOutline,
            iconColor: 'light-dark(#199f43, #5ecc71)',
            defaultData: { code: '' }
        },
        {
            extension: '.css',
            name: 'CSS',
            description: 'Für das Styling von Webseiten',
            priority: 10,
            hide: true,
            icon: mdiLanguageCss3,
            iconColor: 'light-dark(#c4cb00, #ffd700)',
            defaultData: { code: '' }
        },
        {
            extension: '.js',
            name: 'JavaScript',
            description: 'Für die Programmierung von Webseiten',
            priority: 10,
            hide: true,
            icon: mdiLanguageJavascript,
            iconColor: 'light-dark(#2f47b0, #5a80ff)',
            defaultData: { code: '' }
        },
        {
            extension: '.ts',
            name: 'TypeScript',
            description: 'Für die Programmierung von Webseiten',
            priority: 10,
            hide: true,
            icon: mdiLanguageTypescript,
            iconColor: 'light-dark(#1c3fdb, #3f5fec)',
            defaultData: { code: '' }
        },
        {
            extension: '.json',
            name: 'JSON',
            priority: 10,
            hide: true,
            icon: mdiCodeJson,
            iconColor: 'light-dark(#d47628, #ffa359)',
            defaultData: { code: DefaultJsonCode }
        },
        {
            extension: '.yaml',
            name: 'YAML',
            priority: 10,
            hide: true,
            icon: mdiLanguageYaml,
            iconColor: 'light-dark(#d52c36, #ff6762)',
            defaultData: { code: DefaultYamlCode }
        },
        {
            extension: '.yml',
            name: 'YAML',
            priority: 10,
            hide: true,
            icon: mdiLanguageYaml,
            iconColor: 'light-dark(#d52c36, #ff6762)',
            defaultData: { code: DefaultYamlCode }
        }
    ],
    quill_v2: [
        {
            extension: '.qil',
            name: 'Quill',
            description: 'Für Texte mit Formatierungen',
            priority: 1,
            icon: mdiFeather,
            iconColor: 'var(--ifm-color-content)',
            defaultData: { delta: DefaultQuillDelta }
        }
    ]
};
