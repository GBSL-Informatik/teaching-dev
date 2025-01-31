/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import * as Dialog from '@radix-ui/react-dialog';
import classNames from 'classnames';
import React from 'react';
import { useForm } from 'react-hook-form';
// import styles from '../../styles/ui.module.css';
import {
    closeImageDialog$,
    imageAutocompleteSuggestions$,
    imageDialogState$,
    imageUploadHandler$,
    saveImage$
} from '../index';
import { useCellValues, usePublisher } from '@mdxeditor/gurx';
import { editorRootElementRef$, useTranslation } from '@mdxeditor/editor';
import TextInput from '@tdev-components/shared/TextInput';

interface ImageFormFields {
    src: string;
    title: string;
    altText: string;
    file: FileList;
}
const styles: any = {};
export const ImageDialog: React.FC = () => {
    const [imageAutocompleteSuggestions, state, editorRootElementRef, imageUploadHandler] = useCellValues(
        imageAutocompleteSuggestions$,
        imageDialogState$,
        editorRootElementRef$,
        imageUploadHandler$
    );
    const saveImage = usePublisher(saveImage$);
    const closeImageDialog = usePublisher(closeImageDialog$);
    const t = useTranslation();

    const { register, handleSubmit, control, setValue, reset } = useForm<ImageFormFields>({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        values: state.type === 'editing' ? (state.initialValues as any) : {}
    });

    return (
        <Dialog.Root
            open={state.type !== 'inactive'}
            onOpenChange={(open) => {
                if (!open) {
                    closeImageDialog();
                    reset({ src: '', title: '', altText: '' });
                }
            }}
        >
            <Dialog.Portal container={editorRootElementRef?.current}>
                <Dialog.Overlay className={styles.dialogOverlay} />
                <Dialog.Content
                    className={styles.dialogContent}
                    onOpenAutoFocus={(e) => {
                        e.preventDefault();
                    }}
                >
                    <Dialog.Title>{t('uploadImage.dialogTitle', 'Upload an image')}</Dialog.Title>
                    <form
                        onSubmit={(e) => {
                            void handleSubmit(saveImage)(e);
                            reset({ src: '', title: '', altText: '' });
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        className={styles.multiFieldForm}
                    >
                        {imageUploadHandler === null ? (
                            <input type="hidden" accept="image/*" {...register('file')} />
                        ) : (
                            <div className={styles.formField}>
                                <label htmlFor="file">
                                    {t('uploadImage.uploadInstructions', 'Upload an image from your device:')}
                                </label>
                                <input type="file" accept="image/*" {...register('file')} />
                            </div>
                        )}

                        <div className={styles.formField}>
                            <label htmlFor="src">
                                {imageUploadHandler !== null
                                    ? t('uploadImage.addViaUrlInstructions', 'Or add an image from an URL:')
                                    : t(
                                          'uploadImage.addViaUrlInstructionsNoUpload',
                                          'Add an image from an URL:'
                                      )}
                            </label>
                            <TextInput
                                defaultValue={state.type === 'editing' ? (state.initialValues.src ?? '') : ''}
                                onChange={(val) => setValue('src', val)}
                            />
                        </div>

                        <div className={styles.formField}>
                            <label htmlFor="alt">{t('uploadImage.alt', 'Alt:')}</label>
                            <input type="text" {...register('altText')} className={styles.textInput} />
                        </div>

                        <div className={styles.formField}>
                            <label htmlFor="title">{t('uploadImage.title', 'Title:')}</label>
                            <input type="text" {...register('title')} className={styles.textInput} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
                            <button
                                type="submit"
                                title={t('dialogControls.save', 'Save')}
                                aria-label={t('dialogControls.save', 'Save')}
                                className={classNames(styles.primaryButton)}
                            >
                                {t('dialogControls.save', 'Save')}
                            </button>
                            <Dialog.Close asChild>
                                <button
                                    type="reset"
                                    title={t('dialogControls.cancel', 'Cancel')}
                                    aria-label={t('dialogControls.cancel', 'Cancel')}
                                    className={classNames(styles.secondaryButton)}
                                >
                                    {t('dialogControls.cancel', 'Cancel')}
                                </button>
                            </Dialog.Close>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
