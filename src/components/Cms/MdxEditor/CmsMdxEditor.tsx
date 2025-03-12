import React from 'react';
import { observer } from 'mobx-react-lite';
import {
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    codeBlockPlugin,
    CodeToggle,
    ConditionalContents,
    CreateLink,
    diffSourcePlugin,
    DiffSourceToggleWrapper,
    directivesPlugin,
    frontmatterPlugin,
    headingsPlugin,
    InsertCodeBlock,
    InsertFrontmatter,
    InsertTable,
    jsxPlugin,
    linkDialogPlugin,
    linkPlugin,
    listsPlugin,
    ListsToggle,
    markdownShortcutPlugin,
    MDXEditor,
    MDXEditorMethods,
    quotePlugin,
    tablePlugin,
    thematicBreakPlugin,
    toolbarPlugin,
    UndoRedo
} from '@mdxeditor/editor';
import _ from 'lodash';
import '@mdxeditor/editor/style.css';
import { default as FileModel } from '@tdev-models/cms/File';
import { AdmonitionDirectiveDescriptor } from './plugins/AdmonitionDescriptor';
import { DetailsDirectiveDescriptor } from '@tdev-plugins/remark-details/mdx-editor-plugin';
import '@mdxeditor/editor/style.css';
import { InsertAdmonition } from './plugins/AdmonitionDescriptor/InsertAdmonition';
import { InsertJsxElements } from './plugins/plugins-jsx/InsertJsxOptions';
import { MdiDescriptor } from '@tdev-plugins/remark-mdi/mdx-editor-plugin';
import {
    CardsDirectiveDescriptor,
    FlexDirectiveDescriptor
} from '@tdev-plugins/remark-flex-cards/mdx-editor-plugin';
import mdiCompletePlugin from '@tdev-plugins/remark-mdi/mdx-editor-plugin/MdiComplete';
import { ImageCaption, ImageFigure, imagePlugin } from '@tdev-plugins/remark-images/mdx-editor-plugin';
import ErrorBoundary from '@docusaurus/ErrorBoundary';
import styles from './styles.module.scss';
import clsx from 'clsx';
import Actions from './toolbar/Actions';
import * as Mdast from 'mdast';
import { InsertImage } from '@tdev-plugins/remark-images/mdx-editor-plugin/InsertImage';
import { Box, strongPlugin } from '@tdev-plugins/remark-strong/mdx-editor-plugin';
import { ToolbarInsertBoxed } from '@tdev-plugins/remark-strong/mdx-editor-plugin/ToolbarInsertBoxed';
import { useStore } from '@tdev-hooks/useStore';
import { codeMirrorPlugin } from './plugins/Codemirror';
import DefaultEditor from '@tdev-components/Cms/Github/DefaultEditor';
import { Kbd, kbdPlugin } from '@tdev-plugins/remark-kbd/mdx-editor-plugin';
import { ToolbarInsertKbd } from '@tdev-plugins/remark-kbd/mdx-editor-plugin/ToolbarInsertKbd';
import { CodeDefBoxDirectiveDescriptor } from '@tdev-plugins/remark-code-defbox/mdx-editor-plugin';
import { footnotePlugin } from './plugins/footnote';
import Button from '@tdev-components/shared/Button';
import { mathPlugin } from './plugins/mathPlugin';
import MediaDescriptors from '@tdev-plugins/remark-media/mdx-editor-plugin';
import { PdfDescriptor } from '@tdev-plugins/remark-pdf/mdx-editor-plugin/PdfDescriptor';
import { Asset } from '@tdev-models/cms/Dir';
import { draggableBlockPlugin } from './plugins/DraggableBlockPlugin';
import JsxDescriptors from './plugins/plugins-jsx/JsxDescriptors';
import { extractOptions } from '@tdev-plugins/helpers';

export interface Props {
    file: FileModel;
}

const CmsMdxEditor = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const [skipUpdateCheck, setSkipUpdateCheck] = React.useState(false);
    const { file } = props;
    const ref = React.useRef<MDXEditorMethods>(null);
    return (
        <ErrorBoundary
            fallback={({ error, tryAgain }) => (
                <div>
                    <div className={clsx('alert', 'alert--danger')} role="alert">
                        <div>Der Editor ist abgestürzt 😵‍💫: {error.message}</div>
                        Versuche ein anderes Dokument zu öffnen 😎.
                        <Button onClick={tryAgain}>Nochmal versuchen</Button>
                    </div>
                    <DefaultEditor file={file} />
                </div>
            )}
        >
            <MDXEditor
                contentEditableClassName="cms-contenteditable"
                markdown={file.refContent!}
                placeholder="Schreibe deine Inhalte hier..."
                onError={(error) => {
                    console.error('Error in editor', error);
                    setSkipUpdateCheck(true);
                }}
                ref={ref}
                className={clsx(styles.mdxEditor)}
                plugins={[
                    headingsPlugin(),
                    mdiCompletePlugin(),
                    frontmatterPlugin(),
                    listsPlugin(),
                    linkPlugin(),
                    linkDialogPlugin(),
                    quotePlugin(),
                    strongPlugin(),
                    mathPlugin(),
                    jsxPlugin({
                        jsxComponentDescriptors: JsxDescriptors
                    }),
                    directivesPlugin({
                        directiveDescriptors: [
                            AdmonitionDirectiveDescriptor,
                            CodeDefBoxDirectiveDescriptor,
                            DetailsDirectiveDescriptor,
                            MdiDescriptor,
                            FlexDirectiveDescriptor,
                            CardsDirectiveDescriptor,
                            ...MediaDescriptors,
                            PdfDescriptor
                        ]
                    }),
                    thematicBreakPlugin(),
                    draggableBlockPlugin(),
                    tablePlugin(),
                    diffSourcePlugin({ diffMarkdown: file._pristine, viewMode: 'rich-text' }),
                    codeBlockPlugin({ defaultCodeBlockLanguage: 'py' }),
                    codeMirrorPlugin({
                        codeBlockLanguages: {
                            py: 'Python',
                            js: 'JS',
                            json: 'JSON',
                            jsx: 'JSX',
                            ts: 'TS',
                            tsx: 'TSX',
                            css: 'CSS',
                            md: 'MD',
                            mdx: 'MDX',
                            bash: 'bash',
                            html: 'HTML',
                            yaml: 'YAML',
                            sql: 'SQL',
                            psql: 'PSQL',
                            sh: 'Shell',
                            c: 'C',
                            cpp: 'C++',
                            ['mdx-code-block']: 'MdxCodeBlock'
                        },
                        autoLoadLanguageSupport: true
                    }),
                    footnotePlugin(),
                    toolbarPlugin({
                        toolbarClassName: styles.toolbar,
                        toolbarContents: () => (
                            <>
                                <Actions
                                    file={file}
                                    onNeedsRefresh={() => {
                                        ref.current?.setMarkdown(file.content);
                                    }}
                                />
                                <DiffSourceToggleWrapper>
                                    <UndoRedo />
                                    <BoldItalicUnderlineToggles />
                                    <ToolbarInsertBoxed />
                                    <ToolbarInsertKbd />
                                    <ListsToggle />
                                    <InsertCodeBlock />
                                    <InsertTable />
                                    <InsertImage />
                                    <CreateLink />
                                    <CodeToggle />
                                    <BlockTypeSelect />
                                    <InsertAdmonition />
                                    <InsertFrontmatter />
                                    <ConditionalContents
                                        options={[
                                            {
                                                when: (editor) => editor?.editorType === 'codeblock',
                                                contents: () => null
                                            },
                                            {
                                                fallback: () => (
                                                    <>
                                                        <InsertCodeBlock />
                                                    </>
                                                )
                                            }
                                        ]}
                                    />
                                    <InsertJsxElements />
                                </DiffSourceToggleWrapper>
                            </>
                        )
                    }),
                    imagePlugin({
                        imageUploadHandler: (img: File) => {
                            const { activeEntry } = cmsStore;
                            if (!activeEntry) {
                                return Promise.reject('No active entry');
                            }
                            const fPath = `${activeEntry.parent.imageDirPath}/${img.name}`;
                            const current = cmsStore.findEntry(activeEntry.branch, fPath);
                            console.log('uploading image', fPath);
                            return cmsStore
                                .uploadImage(img, fPath, activeEntry.branch, current?.sha)
                                .then((file) => {
                                    if (file) {
                                        return `./${Asset.IMAGE}/${file.name}`;
                                    }
                                    return Promise.reject('Upload Error');
                                });
                        }
                    }),
                    markdownShortcutPlugin(),
                    kbdPlugin()
                ]}
                onChange={(md, initialMarkdownNormalize) => {
                    if (initialMarkdownNormalize && !skipUpdateCheck) {
                        return;
                    }
                    file.setContent(md);
                }}
                toMarkdownOptions={{
                    bullet: '-',
                    emphasis: '*',
                    rule: '-',
                    strong: '*',
                    handlers: {
                        box: (node: Box, parent, state, info) => {
                            const text = node.children.reduce((acc, child) => {
                                return acc + state.handle(child, node, state, info);
                            }, '');
                            return `__${text}__`;
                        },
                        kbd: (node: Kbd, parent, state, info) => {
                            const text = node.children.reduce((acc, child) => {
                                return acc + state.handle(child, node, state, info);
                            }, '');
                            return `[[${text}]]`;
                        },
                        imageFigure: (node: ImageFigure, parent, state, info) => {
                            if (node.children.length < 1) {
                                return '';
                            }
                            const image = node.children[0] as Mdast.Image;
                            const caption = node.children[1] || { children: [] as Mdast.PhrasingContent[] };
                            const text = caption.children.reduce((acc, child) => {
                                return acc + state.handle(child, node, state, info);
                            }, '');
                            const options = extractOptions(image.alt || '');
                            const alt = `${text} ${options}`.trim();
                            return `![${alt}](${image.url})`;
                        }
                    }
                }}
            />
        </ErrorBoundary>
    );
});

export default CmsMdxEditor;
