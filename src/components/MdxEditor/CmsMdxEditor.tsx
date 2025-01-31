import React from 'react';
import { observer } from 'mobx-react-lite';
import {
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    ChangeCodeMirrorLanguage,
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
import { AdmonitionDirectiveDescriptor } from './plugins/plugins-directives/AdmonitionDescriptor';
import { DetailsDirectiveDescriptor } from './plugins/plugins-directives/DetailsDescriptor';
import '@mdxeditor/editor/style.css';
import { InsertAdmonition } from './plugins/plugins-directives/AdmonitionDescriptor/InsertAdmonition';
import { InsertJsxElements } from './plugins/plugins-jsx/InsertJsxOptions';
import BrowserWindowDescriptor from './plugins/plugins-jsx/BrowserWindowDescriptor';
import DocCardListDescriptor from './plugins/plugins-jsx/DocCardListDescriptor';
import { MdiDescriptor } from '../../plugins/remark-mdi/mdx-editor-plugin';
import mdiCompletePlugin from './plugins/MdiComplete';
import { imagePlugin } from './plugins/image';
import { DeflistDescriptor, DdDescriptor, DtDescriptor } from './plugins/plugins-jsx/DeflistDescriptor';
import ErrorBoundary from '@docusaurus/ErrorBoundary';
import styles from './styles.module.scss';
import clsx from 'clsx';
import Actions from './toolbar/Actions';
import * as Mdast from 'mdast';
import { InsertImage } from './plugins/image/InsertImage';
import { strongPlugin } from './plugins/strong';
import { ToolbarInsertBoxed } from './plugins/strong/ToolbarInsertBoxed';
import { useStore } from '@tdev-hooks/useStore';
import { IMAGE_DIR_NAME } from '@tdev-models/cms/Dir';
import { codeMirrorPlugin } from './plugins/codemirror';
import DefaultEditor from '@tdev-components/Github/DefaultEditor';

export interface Props {
    file: FileModel;
}

const CmsMdxEditor = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const { file } = props;
    const { isMarkdown } = file;
    const ref = React.useRef<MDXEditorMethods>(null);
    return (
        <ErrorBoundary
            fallback={({ error, tryAgain }) => (
                <div>
                    <div className={clsx('alert', 'alert--danger')} role="alert">
                        <div>Der Editor ist abgestürzt 😵‍💫: {error.message}</div>
                        Versuche ein anderes Dokument zu öffnen 😎.
                    </div>
                    <DefaultEditor file={file} />
                </div>
            )}
        >
            <MDXEditor
                markdown={file.refContent!}
                placeholder="Schreibe deine Inhalte hier..."
                onError={(error) => {
                    console.error('Error in editor', error);
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
                    jsxPlugin({
                        jsxComponentDescriptors: [
                            BrowserWindowDescriptor,
                            DocCardListDescriptor,
                            DeflistDescriptor,
                            DdDescriptor,
                            DtDescriptor
                        ]
                    }),
                    directivesPlugin({
                        directiveDescriptors: [
                            AdmonitionDirectiveDescriptor,
                            DetailsDirectiveDescriptor,
                            MdiDescriptor
                        ]
                    }),
                    thematicBreakPlugin(),
                    tablePlugin(),
                    diffSourcePlugin({ diffMarkdown: file._pristine, viewMode: 'rich-text' }),
                    codeBlockPlugin({ defaultCodeBlockLanguage: 'py' }),
                    codeMirrorPlugin({
                        codeBlockLanguages: {
                            py: 'Python',
                            js: 'JavaScript',
                            json: 'JSON',
                            jsx: 'JSX',
                            ts: 'TS',
                            tsx: 'TSX',
                            css: 'CSS',
                            md: 'markdown',
                            mdx: 'MDX',
                            bash: 'bash',
                            ['mdx-code-block']: 'mdx-code-block'
                        },
                        autoLoadLanguageSupport: true
                    }),
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
                                    <ListsToggle />
                                    <InsertCodeBlock />
                                    <CreateLink />
                                    <CodeToggle />
                                    <BlockTypeSelect />
                                    <InsertAdmonition />
                                    <InsertFrontmatter />
                                    <InsertTable />
                                    <ConditionalContents
                                        options={[
                                            {
                                                when: (editor) => editor?.editorType === 'codeblock',
                                                contents: () => <ChangeCodeMirrorLanguage />
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
                                    <InsertImage />
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
                                        return `./${IMAGE_DIR_NAME}/${file.name}`;
                                    }
                                    return Promise.reject('Upload Error');
                                });
                        }
                    }),
                    markdownShortcutPlugin()
                ]}
                onChange={(md) => {
                    file.setContent(md);
                }}
                toMarkdownOptions={{
                    bullet: '-',
                    emphasis: '*',
                    rule: '-',
                    handlers: {
                        strong: (node: Mdast.Strong, parent, state, info) => {
                            const text = node.children.reduce((acc, child) => {
                                return acc + state.handle(child, node, state, info);
                            }, '');
                            if (node.data?.hProperties?.class === 'boxed') {
                                return `__${text}__`;
                            }
                            return `**${text}**`;
                        }
                    }
                }}
            />
        </ErrorBoundary>
    );
});

export default CmsMdxEditor;
