import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { NestedLexicalEditor, useNestedEditorContext } from '@mdxeditor/editor';
import { PhrasingContent, Strong } from 'mdast';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_HIGH, KEY_ARROW_DOWN_COMMAND, KEY_ARROW_UP_COMMAND } from 'lexical';
interface Props {}

const BoxEditor = observer((props: Props) => {
    return (
        <span className={clsx(styles.boxEditor)}>
            <NestedLexicalEditor<Strong>
                block={false}
                getContent={(node) => {
                    return node.children || [];
                }}
                contentEditableProps={{
                    className: styles.boxed
                }}
                getUpdatedMdastNode={(mdastNode, children) => {
                    return {
                        type: 'strong',
                        children: children as PhrasingContent[],
                        data: {
                            hProperties: {
                                class: 'boxed'
                            }
                        }
                    };
                }}
            />
        </span>
    );
});

export default BoxEditor;
