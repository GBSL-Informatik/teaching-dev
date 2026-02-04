import type { Code, Node } from 'mdast';
import path from 'path';
import type { LeafDirective } from 'mdast-util-directive';
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx';
import strongPlugin, { transformer as captionVisitor } from '../plugins/remark-strong/plugin';
import deflistPlugin from '../plugins/remark-deflist/plugin';
import mdiPlugin from '../plugins/remark-mdi/plugin';
import kbdPlugin from '../plugins/remark-kbd/plugin';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import defboxPlugin from '../plugins/remark-code-defbox/plugin';
import flexCardsPlugin from '../plugins/remark-flex-cards/plugin';
import imagePlugin, { CaptionVisitor } from '../plugins/remark-images/plugin';
import linkAnnotationPlugin from '../plugins/remark-link-annotation/plugin';
import mediaPlugin from '../plugins/remark-media/plugin';
import detailsPlugin from '../plugins/remark-details/plugin';
import pagePlugin from '../plugins/remark-page/plugin';
import pageProgressStatePlugin from '@tdev/page-progress-state/remark-plugin';
import graphvizPlugin from '@tdev/remark-graphviz/remark-plugin';
import pdfPlugin from '@tdev/remark-pdf/remark-plugin';
import codeAsAttributePlugin from '../plugins/remark-code-as-attribute/plugin';
import commentPlugin from '../plugins/remark-comments/plugin';
import enumerateAnswersPlugin from '../plugins/remark-enumerate-components/plugin';
import { getAnswerDocumentType } from '../components/Answer/helper.answer';

export const flexCardsPluginConfig = [
    flexCardsPlugin,
    {
        wrapInCardImage: (node: Node) => {
            return node.type === 'leafDirective' && (node as LeafDirective).name === 'video';
        }
    }
];

export const deflistPluginConfig = [
    deflistPlugin,
    {
        tagNames: {
            dl: 'Dl'
        }
    }
];

export const codeAsAttributePluginConfig = [
    codeAsAttributePlugin,
    {
        components: [
            {
                name: 'SvgEditor',
                attributeName: 'code'
            },
            {
                name: 'HtmlEditor',
                attributeName: 'code'
            },
            {
                name: 'HtmlIDE',
                attributeName: 'files',
                processMultiple: true
            },
            {
                name: 'Pyodide',
                attributeName: 'code'
            },
            {
                name: 'NetpbmEditor',
                attributeName: 'default'
            },
            {
                name: 'TemplateCode',
                attributeName: 'code',
                codeAttributesName: 'codeAttributes'
            },
            {
                name: 'Val',
                attributeName: 'code'
            }
        ]
    }
];

export const imagePluginConfig = [
    imagePlugin,
    {
        tagNames: {
            sourceRef: 'SourceRef',
            figure: 'Figure'
        },
        srcAttr: process.env.NODE_ENV === 'development' ? 'src' : undefined,
        captionVisitors: [
            (ast, caption) =>
                captionVisitor(ast, caption, (children) => {
                    return {
                        type: 'mdxJsxTextElement',
                        name: 'strong',
                        attributes: [{ type: 'mdxJsxAttribute', name: 'className', value: 'boxed' }],
                        children: children
                    };
                })
        ] satisfies CaptionVisitor[]
    }
];

export const detailsPluginConfig = detailsPlugin;

export const defboxPluginConfig = defboxPlugin;

export const strongPluginConfig = [strongPlugin, { className: 'boxed' }];

export const mdiPluginConfig = [
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
];

export const mediaPluginConfig = mediaPlugin;

export const kbdPluginConfig = kbdPlugin;

export const remarkMathPluginConfig = remarkMath;

export const enumerateAnswersPluginConfig = [
    enumerateAnswersPlugin,
    {
        componentsToEnumerate: ['Answer', 'TaskState', 'SelfCheckTaskState', 'ProgressState']
    }
];

export const pdfPluginConfig = pdfPlugin;

export const pagePluginConfig = [pagePlugin, {}];

export const pageProgressStatePluginConfig = [
    pageProgressStatePlugin,
    {
        components: [
            {
                name: 'Answer',
                docTypeExtractor: (node: MdxJsxFlowElement) =>
                    getAnswerDocumentType(
                        node.attributes.find((a) => a.type === 'mdxJsxAttribute' && a.name === 'type')
                            ?.value as string
                    ) || 'unknown'
            },
            {
                name: 'ProgressState',
                docTypeExtractor: () => 'progress_state'
            },
            {
                name: 'TaskState',
                docTypeExtractor: () => 'task_state'
            },
            {
                name: 'QuillV2',
                docTypeExtractor: () => 'quill_v2'
            },
            {
                name: 'String',
                docTypeExtractor: () => 'string'
            },
            {
                name: 'CmsText',
                docTypeExtractor: () => 'cms_text'
            },
            {
                name: 'CmsCode',
                docTypeExtractor: () => 'cms_text'
            },
            {
                name: 'Restricted',
                docTypeExtractor: () => 'restricted'
            },
            {
                name: 'DynamicDocumentRoots',
                docTypeExtractor: () => 'dynamic_document_roots'
            }
        ],
        persistedCodeType: (node: Code) => {
            if (node.lang === 'html') {
                return 'script';
            }
            const liveLangMatch = /(live_[a-zA-Z0-9-_]+)/.exec(node.meta || '');
            const liveCode = liveLangMatch ? liveLangMatch[1] : null;

            switch (liveCode) {
                case 'live_py':
                case 'live_bry':
                    // legacy name, TODO. should be 'brython_code'?
                    return 'script';
                case 'live_pyo':
                    return 'pyodide_code';
                default:
                    return 'code';
            }
        }
    }
];

export const graphvizPluginConfig = graphvizPlugin;

export const commentPluginConfig = [
    commentPlugin,
    {
        commentableJsxFlowElements: ['DefHeading', 'figcaption', 'String'],
        ignoreJsxFlowElements: ['summary', 'dt'],
        ignoreCodeBlocksWithMeta: /live_py/
    }
];

export const linkAnnotationPluginConfig = [
    linkAnnotationPlugin,
    {
        prefix: '👉',
        postfix: null
    }
];

export const rehypeKatexPluginConfig = rehypeKatex;

export const recommendedBeforeDefaultRemarkPlugins = [
    graphvizPluginConfig,
    deflistPluginConfig,
    flexCardsPluginConfig,
    imagePluginConfig,
    detailsPluginConfig,
    defboxPluginConfig
];

export const recommendedRemarkPlugins = [
    strongPluginConfig,
    mdiPluginConfig,
    mediaPluginConfig,
    kbdPluginConfig,
    remarkMathPluginConfig,
    enumerateAnswersPluginConfig,
    pdfPluginConfig,
    pagePluginConfig,
    pageProgressStatePluginConfig,
    commentPluginConfig,
    linkAnnotationPluginConfig,
    codeAsAttributePluginConfig
];

export const recommendedRehypePlugins = [rehypeKatexPluginConfig];
