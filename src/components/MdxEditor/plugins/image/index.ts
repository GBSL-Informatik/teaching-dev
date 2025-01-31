/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import { $wrapNodeInElement, CAN_USE_DOM, mergeRegister } from '@lexical/utils';
import { Action, Cell, Signal, map, mapTo, withLatestFrom } from '@mdxeditor/gurx';
import {
    $createParagraphNode,
    $createRangeSelection,
    $getNodeByKey,
    $getSelection,
    $insertNodes,
    $isNodeSelection,
    $isRootOrShadowRoot,
    $setSelection,
    COMMAND_PRIORITY_CRITICAL,
    COMMAND_PRIORITY_EDITOR,
    COMMAND_PRIORITY_HIGH,
    COMMAND_PRIORITY_LOW,
    DRAGOVER_COMMAND,
    DRAGSTART_COMMAND,
    DROP_COMMAND,
    LexicalCommand,
    LexicalEditor,
    PASTE_COMMAND,
    createCommand
} from 'lexical';
import { LexicalImageVisitor } from './LexicalImageVisitor';
import {
    activeEditor$,
    addComposerChild$,
    addExportVisitor$,
    addImportVisitor$,
    addLexicalNode$,
    createActiveEditorSubscription$,
    realmPlugin
} from '@mdxeditor/editor';
import { $createImageNode, $isImageNode, CreateImageNodeParameters, ImageNode } from './ImageNode';
import { MdastImageVisitor } from './MdastImageVisitor';
import React from 'react';

export * from './ImageNode';

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
        theEditor?.update(() => {
            const imageNode = $createImageNode({
                altText: values.altText ?? '',
                src: values.src
            });
            $insertNodes([imageNode]);
            if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
                $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
            }
        });
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
            [addImportVisitor$]: [MdastImageVisitor],
            [addLexicalNode$]: ImageNode,
            [addExportVisitor$]: LexicalImageVisitor,
            [imageUploadHandler$]: params?.imageUploadHandler ?? null,
            [disableImageResize$]: Boolean(params?.disableImageResize),
            [disableImageSettingsButton$]: Boolean(params?.disableImageSettingsButton),
            [imagePreviewHandler$]: params?.imagePreviewHandler ?? null,
            [createActiveEditorSubscription$]: [
                (editor: LexicalEditor) => {
                    const theUploadHandler = realm.getValue(imageUploadHandler$);
                    return mergeRegister(
                        editor.registerCommand<InsertImagePayload>(
                            INSERT_IMAGE_COMMAND,
                            (payload) => {
                                const imageNode = $createImageNode(payload);
                                $insertNodes([imageNode]);
                                if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
                                    $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
                                }

                                return true;
                            },
                            COMMAND_PRIORITY_EDITOR
                        ),
                        editor.registerCommand<DragEvent>(
                            DRAGSTART_COMMAND,
                            (event) => {
                                return onDragStart(event);
                            },
                            COMMAND_PRIORITY_HIGH
                        ),
                        editor.registerCommand<DragEvent>(
                            DRAGOVER_COMMAND,
                            (event) => {
                                return onDragover(event, !!theUploadHandler);
                            },
                            COMMAND_PRIORITY_LOW
                        ),

                        editor.registerCommand<DragEvent>(
                            DROP_COMMAND,
                            (event) => {
                                return onDrop(event, editor, realm.getValue(imageUploadHandler$));
                            },
                            COMMAND_PRIORITY_HIGH
                        ),
                        editor.registerCommand(
                            PASTE_COMMAND,
                            (event: ClipboardEvent) => {
                                if (!theUploadHandler) {
                                    let fromWeb = Array.from(event.clipboardData?.items ?? []);
                                    fromWeb = fromWeb.filter((i) => i.type.includes('text')); // Strip out the non-image bits

                                    if (!fromWeb.length || fromWeb.length === 0) {
                                        return true;
                                    } // If from file system, eject without calling imageUploadHandler.
                                    return false; // If from web, bail.
                                }

                                const cbPayload = Array.from(event.clipboardData?.items ?? []);
                                const isMixedPayload = cbPayload.some((item) => !item.type.includes('image'));
                                if (isMixedPayload) return false;

                                if (!cbPayload.length || cbPayload.length === 0) {
                                    return false;
                                } // If no image was present in the collection, bail.

                                const imageUploadHandlerValue = realm.getValue(imageUploadHandler$)!;

                                Promise.all(
                                    cbPayload.map((file) => imageUploadHandlerValue(file.getAsFile()!))
                                )
                                    .then((urls) => {
                                        urls.forEach((url) => {
                                            editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                                                src: url,
                                                altText: ''
                                            });
                                        });
                                    })
                                    .catch((e: unknown) => {
                                        throw e;
                                    });
                                return true;
                            },
                            COMMAND_PRIORITY_CRITICAL
                        )
                    );
                }
            ]
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

/** @internal */
export type InsertImagePayload = Readonly<CreateImageNodeParameters>;

const getDOMSelection = (targetWindow: Window | null): Selection | null =>
    CAN_USE_DOM ? (targetWindow ?? window).getSelection() : null;

/**
 * @internal
 */
export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> = createCommand('INSERT_IMAGE_COMMAND');

const TRANSPARENT_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function onDragStart(event: DragEvent): boolean {
    const node = getImageNodeInSelection();
    if (!node) {
        return false;
    }
    const dataTransfer = event.dataTransfer;
    if (!dataTransfer) {
        return false;
    }
    dataTransfer.setData('text/plain', '_');
    const img = document.createElement('img');
    img.src = TRANSPARENT_IMAGE;
    dataTransfer.setDragImage(img, 0, 0);
    dataTransfer.setData(
        'application/x-lexical-drag',
        JSON.stringify({
            data: {
                altText: node.__altText,
                key: node.getKey(),
                src: node.__src
            },
            type: 'image'
        })
    );

    return true;
}

function onDragover(event: DragEvent, hasUploadHandler: boolean): boolean {
    if (hasUploadHandler) {
        // test if the user is dragging a file from the explorer
        let cbPayload = Array.from(event.dataTransfer?.items ?? []);
        cbPayload = cbPayload.filter((i) => i.type.includes('image')); // Strip out the non-image bits

        if (cbPayload.length > 0) {
            event.preventDefault();
            return true;
        }
    }

    // handle moving images
    const node = getImageNodeInSelection();
    if (!node) {
        return false;
    }
    if (!canDropImage(event)) {
        event.preventDefault();
    }

    return true;
}

function onDrop(event: DragEvent, editor: LexicalEditor, imageUploadHandler: ImageUploadHandler): boolean {
    let cbPayload = Array.from(event.dataTransfer?.items ?? []);
    cbPayload = cbPayload.filter((i) => i.type.includes('image')); // Strip out the non-image bits

    if (cbPayload.length > 0) {
        if (imageUploadHandler !== null) {
            event.preventDefault();
            Promise.all(cbPayload.map((image) => imageUploadHandler(image.getAsFile()!)))
                .then((urls) => {
                    urls.forEach((url) => {
                        editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                            src: url,
                            altText: ''
                        });
                    });
                })
                .catch((e: unknown) => {
                    throw e;
                });

            return true;
        }
    }

    const node = getImageNodeInSelection();
    if (!node) {
        return false;
    }
    const data = getDragImageData(event);

    if (!data) {
        return false;
    }

    event.preventDefault();
    if (canDropImage(event)) {
        const range = getDragSelection(event);
        node.remove();
        const rangeSelection = $createRangeSelection();
        if (range !== null && range !== undefined) {
            rangeSelection.applyDOMRange(range);
        }
        $setSelection(rangeSelection);
        editor.dispatchCommand(INSERT_IMAGE_COMMAND, data);
    }
    return true;
}

function getImageNodeInSelection(): ImageNode | null {
    const selection = $getSelection();
    if (!$isNodeSelection(selection)) {
        return null;
    }
    const nodes = selection.getNodes();
    const node = nodes[0];
    return $isImageNode(node) ? node : null;
}

function getDragImageData(event: DragEvent): null | InsertImagePayload {
    const dragData = event.dataTransfer?.getData('application/x-lexical-drag');
    if (!dragData) {
        return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { type, data } = JSON.parse(dragData);
    if (type !== 'image') {
        return null;
    }

    return data;
}

declare global {
    interface DragEvent {
        rangeOffset?: number;
        rangeParent?: Node;
    }
}

function canDropImage(event: DragEvent): boolean {
    const target = event.target;
    return !!(target && target instanceof HTMLElement && target.parentElement);
}

function getDragSelection(event: DragEvent): Range | null | undefined {
    let range;
    const target = event.target as null | Element | Document;
    const targetWindow =
        target == null
            ? null
            : target.nodeType === 9
              ? (target as Document).defaultView
              : (target as Element).ownerDocument.defaultView;
    const domSelection = getDOMSelection(targetWindow);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(event.clientX, event.clientY);
    } else if (event.rangeParent && domSelection !== null) {
        domSelection.collapse(event.rangeParent, event.rangeOffset ?? 0);
        range = domSelection.getRangeAt(0);
    } else {
        throw Error(`Cannot get the selection when dragging`);
    }

    return range;
}
