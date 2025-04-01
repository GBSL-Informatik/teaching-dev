/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import React from 'react';

import type { BaseSelection, LexicalEditor } from 'lexical';

import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection.js';
import { mergeRegister } from '@lexical/utils';
import { $getSelection, $isNodeSelection, CLICK_COMMAND, COMMAND_PRIORITY_LOW } from 'lexical';
import ImageResizer from '../ImageResizer';
import { type ImageNode } from '../ImageNode';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { useAssetFile } from '@tdev-components/Cms/MdxEditor/hooks/useAssetFile';
import Icon from '@mdi/react';
import { mdiImage, mdiImageEditOutline } from '@mdi/js';
import Loader from '@tdev-components/Loader';
import RemoveNode from '@tdev-components/Cms/MdxEditor/RemoveNode';
import { $isImageFigureNode } from '../ImageFigureNode';
import GenericAttributeEditor from '@tdev-components/Cms/MdxEditor/GenericAttributeEditor';
import { ParsedOptions } from '@tdev-plugins/helpers';
import { asStringRecord } from '@tdev-components/Cms/MdxEditor/helpers/asStringRecord';
import Badge from '@tdev-components/shared/Badge';
import Popup from 'reactjs-popup';
import { ImageDialog } from '../ImagesDialog';
import Button from '@tdev-components/shared/Button';
import { PopupActions } from 'reactjs-popup/dist/types';
import { SIZE_S } from '@tdev-components/shared/iconSizes';

export interface ImageEditorProps {
    nodeKey: string;
    imageNode: ImageNode;
    src: string;
    options: ParsedOptions;
    editor: LexicalEditor;
}

export const ImageComponent = observer((props: ImageEditorProps): React.ReactNode => {
    const { src, imageNode, nodeKey, options, editor } = props;
    const ref = React.useRef<PopupActions>(null);

    const imageRef = React.useRef<null | HTMLImageElement>(null);
    const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
    const [selection, setSelection] = React.useState<BaseSelection | null>(null);
    const [isResizing, setIsResizing] = React.useState<boolean>(false);
    const gitImg = useAssetFile(src);

    React.useEffect(() => {
        if (imageRef.current) {
            let imgFigure = imageRef.current.parentElement;
            while (imgFigure && !imgFigure.classList.contains('lexicalImageFigure')) {
                imgFigure = imgFigure.parentElement;
            }
            if (imgFigure && !imgFigure.style.getPropertyValue('--cms-img-width')) {
                imgFigure.style.setProperty('--cms-img-width', `${imageRef.current.width}px`);
            }
        }
    }, [imageRef]);

    React.useEffect(() => {
        let isMounted = true;
        const unregister = mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                if (isMounted) {
                    setSelection(editorState.read(() => $getSelection()));
                }
            }),
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
            )
        );
        return () => {
            isMounted = false;
            unregister();
        };
    }, [clearSelection, editor, isResizing, isSelected, imageNode, setSelected]);

    const onResizeEnd = React.useCallback(
        (nextWidth: number, nextHeight: number) => {
            // Delay hiding the resize bars for click case
            setTimeout(() => {
                setIsResizing(false);
            }, 200);

            editor.update(() => {
                editor.focus();
                imageNode.setWidth(nextWidth);
            });
        },
        [editor, imageNode]
    );

    const removeImageFigure = React.useCallback(() => {
        editor?.update(() => {
            const figure = imageNode.getParent();
            if ($isImageFigureNode(figure)) {
                const focusNext =
                    figure.getPreviousSibling() || figure.getNextSibling() || figure.getParent();
                figure.remove(false);
                focusNext?.selectEnd();
            }
        });
    }, [imageNode, editor]);

    const onResizeStart = React.useCallback(() => {
        setIsResizing(true);
    }, []);

    const draggable = $isNodeSelection(selection);
    const showPlaceholder = gitImg && (gitImg.type !== 'bin_file' || !gitImg.isImage);

    return (
        <div className={clsx(styles.imageEditor, isResizing && 'resizing')}>
            {!isResizing && (
                <div className={clsx(styles.actions, isSelected && styles.focused)}>
                    <Badge title="Anzahl Optionen" type="primary">
                        {Object.keys(options).length}
                    </Badge>
                    <div className={styles.spacer} />
                    <Popup
                        on="click"
                        trigger={
                            <span>
                                <Button icon={mdiImageEditOutline} size={SIZE_S} />
                            </span>
                        }
                        modal
                        ref={ref}
                        overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
                    >
                        <ImageDialog
                            onSelect={(src) => {
                                editor.update(() => {
                                    editor.focus();
                                    imageNode.setSrc(src);
                                });
                            }}
                            className={clsx(styles.imageDialog)}
                            src={src}
                            binFile={gitImg?.type === 'bin_file' ? gitImg : undefined}
                            onClose={() => {
                                ref.current?.close();
                            }}
                        />
                    </Popup>
                    <GenericAttributeEditor
                        onUpdate={(values) => {
                            editor.update(() => {
                                editor.focus();
                                imageNode.setOptions(values);
                            });
                        }}
                        properties={[
                            {
                                name: 'width',
                                type: 'string',
                                removable: false
                            }
                        ]}
                        values={asStringRecord(options)}
                        canExtend
                    />
                    <RemoveNode onRemove={removeImageFigure} className={clsx(styles.remove)} />
                </div>
            )}
            <div className={styles.imageWrapper} data-editor-block-type="image">
                <div draggable={draggable}>
                    {showPlaceholder ? (
                        <div className={clsx(styles.placeholder, isSelected && styles.focusedImage)}>
                            <Icon path={mdiImage} size={3} color="var(--ifm-color-secondary)" />
                            <Loader label="Laden..." />
                        </div>
                    ) : (
                        <img
                            className={clsx(isSelected && styles.focusedImage)}
                            src={gitImg?.type === 'bin_file' && gitImg.isImage ? gitImg.src : src}
                            width={(options.width as string) || '100%'}
                            ref={imageRef}
                            draggable="false"
                        />
                    )}
                </div>
                {draggable && isSelected && (
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
