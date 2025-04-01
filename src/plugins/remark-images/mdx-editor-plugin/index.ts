/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import { $insertNodeToNearestRoot } from '@lexical/utils';
import { Cell, Signal, withLatestFrom } from '@mdxeditor/gurx';
import {
    $createParagraphNode,
    $getNearestRootOrShadowRoot,
    $getSelection,
    $isElementNode,
    $isLeafNode,
    $isParagraphNode,
    $isRangeSelection,
    $isTextNode,
    COMMAND_PRIORITY_EDITOR,
    KEY_DOWN_COMMAND,
    LexicalEditor
} from 'lexical';
import {
    LexicalImageCaptionVisitor,
    LexicalImageFigureVisitor,
    LexicalImageVisitor
} from './LexicalImageVisitor';
import {
    activeEditor$,
    addExportVisitor$,
    addImportVisitor$,
    addLexicalNode$,
    addMdastExtension$,
    createRootEditorSubscription$,
    createActiveEditorSubscription$,
    realmPlugin
} from '@mdxeditor/editor';
import { $createImageNode, ImageNode } from './ImageNode';
import { MdastImageCaptionVisitor, MdastImageFigureVisitor, MdastImageVisitor } from './MdastImageVisitor';
import React from 'react';
import { rootStore } from '@tdev/stores/rootStore';
import type { Parent, PhrasingContent, Root, Image } from 'mdast';
import { transformer } from '../transformer';
import { transformer as strongTransformer } from '@tdev-plugins/remark-strong/plugin';
import { $createImageCaptionNode, $isImageCaptionNode, ImageCaptionNode } from './ImageCaptionNode';
import { $createImageFigureNode, ImageFigureNode } from './ImageFigureNode';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { directiveFromMarkdown } from 'mdast-util-directive';
import { directive } from 'micromark-extension-directive';
import scheduleMicrotask from '@tdev-components/util/scheduleMicrotask';
import { $isHeadingNode } from '@lexical/rich-text';
export * from './ImageNode';

export interface ImageCaption extends Parent {
    type: 'imageCaption';
    children: PhrasingContent[];
}
export interface ImageFigure extends Parent {
    type: 'imageFigure';
    children: [Image, ImageCaption];
}
declare module 'mdast' {
    interface RootContentMap {
        imageCaption: ImageCaption;
        imageFigure: ImageFigure;
    }
}

/**
 * @group Image
 */
export type ImageUploadHandler = ((image: File) => Promise<string>) | null;

/**
 * @group Image
 */
export type ImagePreviewHandler = ((imageSource: string) => Promise<string>) | null;

interface BaseImageParameters {
    altText?: string;
    title?: string;
}

/**
 * @group Image
 */
export interface FileImageParameters extends BaseImageParameters {
    file: File;
}

/**
 * @group Image
 */
export interface SrcImageParameters extends BaseImageParameters {
    src: string;
}
/**
 * @group Image
 */
export type InsertImageParameters = FileImageParameters | SrcImageParameters;

/**
 * @group Image
 */
export interface SaveImageParameters extends BaseImageParameters {
    src?: string;
    file: FileList;
}

const internalInsertImage$ = Signal<SrcImageParameters>((r) => {
    r.sub(r.pipe(internalInsertImage$, withLatestFrom(activeEditor$)), ([values, theEditor]) => {
        if (!theEditor) {
            return;
        }
        theEditor.focus(
            () => {
                theEditor.read(() => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        const nodes = selection.getNodes();
                        console.log('nodes', nodes[0]?.getTextContent());
                        const selectedNode = nodes[0];
                        if (!selectedNode) {
                            return;
                        }
                        let currentNode = selectedNode;
                        let parent = selectedNode.getParent();
                        while (($isElementNode(parent) && parent.isInline()) || $isHeadingNode(parent)) {
                            currentNode = parent;
                            parent = currentNode.getParent();
                        }
                        theEditor.update(() => {
                            const imageFigure = $createImageFigureNode();
                            const imageNode = $createImageNode({
                                altText: values.altText ?? '',
                                src: values.src
                            });
                            const imageCaption = $createImageCaptionNode();
                            imageCaption.append($createParagraphNode());
                            imageFigure.append(imageNode, imageCaption);
                            if ($isParagraphNode(currentNode.getParent())) {
                                currentNode.getParent()!.insertAfter(imageFigure);
                            } else {
                                currentNode.insertAfter(imageFigure);
                            }
                        });
                    }
                });
            },
            { defaultSelection: 'rootEnd' }
        );
    });
});

/**
 * A signal that inserts a new image node with the published payload.
 * @group Image
 */
export const insertImage$ = Signal<InsertImageParameters>((r) => {
    r.sub(r.pipe(insertImage$, withLatestFrom(imageUploadHandler$)), ([values, imageUploadHandler]) => {
        const handler = (src: string) => {
            r.pub(internalInsertImage$, { ...values, src });
        };

        if ('file' in values) {
            imageUploadHandler?.(values.file)
                .then(handler)
                .catch((e: unknown) => {
                    throw e;
                });
        } else {
            handler(values.src);
        }
    });
});
/**
 * Holds the autocomplete suggestions for image sources.
 * @group Image
 */
export const imageAutocompleteSuggestions$ = Cell<string[]>([]);

/**
 * Holds the disable image resize configuration flag.
 * @group Image
 */
export const disableImageResize$ = Cell<boolean>(false);

/**
 * Holds the image upload handler callback.
 * @group Image
 */
export const imageUploadHandler$ = Cell<ImageUploadHandler>(null);

/**
 * Holds the image preview handler callback.
 * @group Image
 */
export const imagePreviewHandler$ = Cell<ImagePreviewHandler>(null);

export const disableImageSettingsButton$ = Cell<boolean>(false);

/**
 * Saves the data from the image dialog
 * @group Image
 */
export const saveImage$ = Signal<SaveImageParameters>();

const handledKeys = new Set(['Enter', 'Backspace', 'Delete', 'ArrowLeft']);

const keyHandler = (editor: LexicalEditor) => {
    return editor.registerCommand<KeyboardEvent>(
        KEY_DOWN_COMMAND,
        (event, activeEditor) => {
            const shouldHandle = handledKeys.has(event.key);
            if (!shouldHandle) {
                return false;
            }
            let shouldPrevent = false;

            activeEditor.read(() => {
                const selection = $getSelection();

                if ($isRangeSelection(selection)) {
                    const firstNode = selection.getNodes()[0];
                    if (firstNode) {
                        const isFirstCaption = $isImageCaptionNode(firstNode);
                        const caption = isFirstCaption
                            ? firstNode
                            : firstNode.getParents().find((parent) => $isImageCaptionNode(parent));
                        if (!caption) {
                            return false;
                        }
                        switch (event.key) {
                            case 'Backspace':
                                if (
                                    (isFirstCaption || $isParagraphNode(firstNode.getParent())) &&
                                    selection.anchor.offset === 0 &&
                                    selection.focus.offset === 0
                                ) {
                                    shouldPrevent = true;
                                }
                                break;
                            case 'Delete':
                                const end = caption.getTextContentSize();
                                if (
                                    (isFirstCaption || $isParagraphNode(firstNode.getParent())) &&
                                    selection.anchor.offset === end &&
                                    selection.focus.offset === end
                                ) {
                                    shouldPrevent = true;
                                }
                                break;
                            case 'Enter':
                                shouldPrevent = true;
                                const figure = caption.getParent();
                                const nextSibling = figure?.getNextSibling();
                                if ($isParagraphNode(nextSibling)) {
                                    scheduleMicrotask(() => {
                                        activeEditor.update(() => {
                                            nextSibling.selectStart();
                                        });
                                    });
                                } else {
                                    scheduleMicrotask(() => {
                                        activeEditor.update(
                                            () => {
                                                const newParagraph = $createParagraphNode();
                                                figure?.insertAfter(newParagraph);
                                                newParagraph.selectStart();
                                            },
                                            { discrete: true }
                                        );
                                    });
                                }
                                break;
                            case 'ArrowLeft':
                                if (
                                    (isFirstCaption || $isParagraphNode(firstNode.getParent())) &&
                                    selection.anchor.offset === 0 &&
                                    selection.focus.offset === 0
                                ) {
                                    const figure = caption.getParent();
                                    const previousSibling = figure?.getPreviousSibling();
                                    scheduleMicrotask(() => {
                                        activeEditor.update(
                                            () => {
                                                if ($isParagraphNode(previousSibling)) {
                                                    previousSibling.selectEnd();
                                                } else {
                                                    const newParagraph = $createParagraphNode();
                                                    figure?.insertBefore(newParagraph);
                                                    newParagraph.selectEnd();
                                                }
                                            },
                                            { discrete: true }
                                        );
                                    });
                                    shouldPrevent = true;
                                }
                        }
                    }
                }
            });

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (shouldPrevent) {
                event.preventDefault();
                event.stopPropagation();
                return true;
            }

            return false;
        },
        COMMAND_PRIORITY_EDITOR
    );
};

/**
 * A plugin that adds support for images.
 * @group Image
 */
export const imagePlugin = realmPlugin<{
    imageUploadHandler?: ImageUploadHandler;
    imageAutocompleteSuggestions?: string[];
    disableImageResize?: boolean;
    disableImageSettingsButton?: boolean;
    imagePreviewHandler?: ImagePreviewHandler;
    ImageDialog?: (() => React.ReactNode) | React.FC;
}>({
    init(realm, params) {
        realm.pubIn({
            [addImportVisitor$]: [MdastImageFigureVisitor, MdastImageVisitor, MdastImageCaptionVisitor],
            [addLexicalNode$]: [ImageNode, ImageFigureNode, ImageCaptionNode],
            [addExportVisitor$]: [LexicalImageFigureVisitor, LexicalImageCaptionVisitor, LexicalImageVisitor],
            [imageUploadHandler$]: params?.imageUploadHandler ?? null,
            [disableImageResize$]: Boolean(params?.disableImageResize),
            [disableImageSettingsButton$]: Boolean(params?.disableImageSettingsButton),
            [imagePreviewHandler$]: params?.imagePreviewHandler ?? null,
            [addMdastExtension$]: [
                {
                    name: 'images-plugin',
                    transforms: [
                        (ast: Root) => {
                            const editedFile = rootStore.cmsStore.editedFile;
                            transformer(ast, editedFile?.type === 'file' ? editedFile.content : '', {
                                cleanAltText: false,
                                caption: (rawCaption, options) => {
                                    const captionAst = fromMarkdown(rawCaption, 'utf-8', {
                                        extensions: [directive()],
                                        mdastExtensions: [
                                            {
                                                transforms: [
                                                    (ast: Root) => {
                                                        strongTransformer(ast, rawCaption, (children) => ({
                                                            type: 'box',
                                                            children: children
                                                        }));
                                                    }
                                                ]
                                            },
                                            directiveFromMarkdown()
                                        ]
                                    });

                                    const children = rawCaption ? captionAst.children : [];

                                    /**
                                     * Add alt as caption
                                     */
                                    const caption = {
                                        type: 'imageCaption',
                                        children: children
                                    } as ImageCaption;
                                    return caption;
                                },
                                figure: (children, options) => {
                                    return {
                                        type: 'imageFigure',
                                        children: children
                                    };
                                },
                                merge: (figure, caption) => {
                                    figure.children.splice(figure.children.length, 0, caption as any);
                                    return figure;
                                }
                            });
                        }
                    ]
                }
            ],
            [createRootEditorSubscription$]: keyHandler,
            [createActiveEditorSubscription$]: keyHandler
        });
    },

    update(realm, params) {
        realm.pubIn({
            [imageUploadHandler$]: params?.imageUploadHandler ?? null,
            [disableImageResize$]: Boolean(params?.disableImageResize),
            [imagePreviewHandler$]: params?.imagePreviewHandler ?? null
        });
    }
});

// currently, drag and drop is not supported...
