/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import React from 'react';

import type { BaseSelection, LexicalEditor } from 'lexical';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection.js';
import { mergeRegister } from '@lexical/utils';
import {
    $getNodeByKey,
    $getSelection,
    $isNodeSelection,
    CLICK_COMMAND,
    COMMAND_PRIORITY_LOW,
    DRAGSTART_COMMAND,
    KEY_BACKSPACE_COMMAND,
    KEY_DELETE_COMMAND,
    SELECTION_CHANGE_COMMAND
} from 'lexical';
import ImageResizer from '../ImageResizer';
import { $isImageNode, type ImageNode } from '../ImageNode';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import styles from './styles.module.scss';
import TextInput from '@tdev-components/shared/TextInput';
import File from '@tdev-models/cms/File';

export interface ImageEditorProps {
    nodeKey: string;
    src: string;
    width?: number;
}

export const ImageComponent = observer((props: ImageEditorProps): React.ReactNode => {
    const { src, nodeKey } = props;
    const cmsStore = useStore('cmsStore');

    const imageRef = React.useRef<null | HTMLImageElement>(null);
    const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
    const [editor] = useLexicalComposerContext();
    const [selection, setSelection] = React.useState<BaseSelection | null>(null);
    const activeEditorRef = React.useRef<LexicalEditor | null>(null);
    const [isResizing, setIsResizing] = React.useState<boolean>(false);

    const onDelete = React.useCallback(
        (payload: KeyboardEvent) => {
            if (isSelected && $isNodeSelection($getSelection())) {
                const event: KeyboardEvent = payload;
                event.preventDefault();
                const node = $getNodeByKey(nodeKey);
                if ($isImageNode(node)) {
                    node!.remove();
                }
            }
            return false;
        },
        [isSelected, nodeKey]
    );

    React.useEffect(() => {
        let isMounted = true;
        const unregister = mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                if (isMounted) {
                    setSelection(editorState.read(() => $getSelection()));
                }
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                (_, activeEditor) => {
                    activeEditorRef.current = activeEditor;
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand<MouseEvent>(
                CLICK_COMMAND,
                (payload) => {
                    const event = payload;

                    if (isResizing) {
                        return true;
                    }
                    if (event.target === imageRef.current) {
                        if (event.shiftKey) {
                            setSelected(!isSelected);
                        } else {
                            clearSelection();
                            setSelected(true);
                        }
                        return true;
                    }

                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                DRAGSTART_COMMAND,
                (event) => {
                    if (event.target === imageRef.current) {
                        // TODO This is just a temporary workaround for FF to behave like other browsers.
                        // Ideally, this handles drag & drop too (and all browsers).
                        event.preventDefault();
                        return true;
                    }
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
            editor.registerCommand(KEY_BACKSPACE_COMMAND, onDelete, COMMAND_PRIORITY_LOW)
        );
        return () => {
            isMounted = false;
            unregister();
        };
    }, [clearSelection, editor, isResizing, isSelected, nodeKey, onDelete, setSelected]);

    const onResizeEnd = (nextWidth: number, nextHeight: number) => {
        // Delay hiding the resize bars for click case
        setTimeout(() => {
            setIsResizing(false);
        }, 200);

        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isImageNode(node)) {
                (node as ImageNode).setWidth(nextWidth);
            }
        });
    };

    const onResizeStart = () => {
        setIsResizing(true);
    };

    const { editedFile } = cmsStore;
    const gitImg = editedFile?.findEntryByRelativePath(src);

    const draggable = $isNodeSelection(selection);
    const isFocused = isSelected;
    if (gitImg && (gitImg.type !== 'file' || !gitImg.isImage)) {
        return null;
    }

    return (
        <div className={styles.imageEditor}>
            <div className={styles.imageWrapper} data-editor-block-type="image">
                <div draggable={draggable}>
                    <img
                        className={clsx(isFocused && styles.focusedImage)}
                        src={gitImg?.type === 'file' && gitImg.isImage ? File.ImageDataUrl(gitImg) : src}
                        width={props.width}
                        ref={imageRef}
                        draggable="false"
                    />
                </div>
                {draggable && isFocused && (
                    <ImageResizer
                        editor={editor}
                        imageRef={imageRef}
                        onResizeStart={onResizeStart}
                        onResizeEnd={onResizeEnd}
                    />
                )}
            </div>
        </div>
    );
});
