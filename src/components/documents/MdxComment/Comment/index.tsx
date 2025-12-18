import React from 'react';
import clsx from 'clsx';
import sharedStyles from '../styles.module.scss';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { DocumentType } from '@tdev-api/document';
import MdxComment from '@tdev-models/documents/MdxComment';
import { QuillV2Component } from '@tdev-components/documents/QuillV2';
import Icon, { Stack } from '@mdi/react';
import {
    mdiCommentAccount,
    mdiCommentAccountOutline,
    mdiDotsHorizontalCircle,
    mdiDotsHorizontalCircleOutline
} from '@mdi/js';
import Options from './Options';
import { useStore } from '@tdev-hooks/useStore';

interface Props {
    comment: MdxComment;
}

const Comment = observer((props: Props) => {
    const { comment } = props;
    const userStore = useStore('userStore');
    return (
        <>
            <div
                className={clsx(
                    'comment-wrapper',
                    sharedStyles.wrapper,
                    sharedStyles.colorized,
                    sharedStyles.active,
                    comment.isOpen && sharedStyles.open,
                    comment.isOpen && 'open',
                    sharedStyles[comment.color],
                    styles.iconWrapper
                )}
            >
                <div
                    className={clsx(sharedStyles.comment)}
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                    }}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        comment.setIsOpen(!comment.isOpen);
                    }}
                >
                    <Stack size={1} color={null}>
                        <Icon
                            path={comment.isOpen ? mdiCommentAccountOutline : mdiCommentAccount}
                            size={1}
                            color="var(--ifm-background-color)"
                        />
                        <Icon
                            path={comment.isOpen ? mdiCommentAccount : mdiCommentAccountOutline}
                            size={1}
                            color="var(--comment-ico-color)"
                        />
                    </Stack>
                </div>
            </div>
            {comment.isOpen && (
                <div
                    className={clsx(
                        styles.content,
                        sharedStyles.colorized,
                        sharedStyles[comment.color],
                        sharedStyles.active
                    )}
                >
                    {comment.isOpen && (
                        <div
                            className={clsx(styles.options, comment.optionsOpen && styles.open)}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                            }}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                comment.setOptionsOpen(!comment.optionsOpen);
                            }}
                        >
                            <Stack size={1} color={null}>
                                <Icon
                                    path={
                                        comment.optionsOpen
                                            ? mdiDotsHorizontalCircleOutline
                                            : mdiDotsHorizontalCircle
                                    }
                                    size={1}
                                    color="var(--ifm-background-color)"
                                />
                                <Icon
                                    path={
                                        comment.optionsOpen
                                            ? mdiDotsHorizontalCircle
                                            : mdiDotsHorizontalCircleOutline
                                    }
                                    size={1}
                                    color="var(--comment-ico-color)"
                                />
                            </Stack>
                        </div>
                    )}
                    {comment.optionsOpen && <Options comment={comment} />}
                    {comment.children
                        .filter((doc) => doc.type === 'quill_v2')
                        .map((doc) => {
                            return (
                                <QuillV2Component
                                    quillDoc={doc}
                                    className={styles.quill}
                                    key={doc.id}
                                    theme="bubble"
                                    placeholder="🗒️ Notiz..."
                                    readonly={comment.authorId !== userStore.current?.id}
                                />
                            );
                        })}
                </div>
            )}
        </>
    );
});

export default Comment;
