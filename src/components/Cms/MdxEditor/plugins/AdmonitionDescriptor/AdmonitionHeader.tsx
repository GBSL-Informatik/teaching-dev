/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React from 'react';
import { $isDirectiveNode, NestedLexicalEditor, useMdastNodeUpdater } from '@mdxeditor/editor';
import { ContainerDirective } from 'mdast-util-directive';
import { Paragraph, PhrasingContent } from 'mdast';
import styles from './styles.module.scss';
import clsx from 'clsx';
import { mdiChevronDown } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import Popup from 'reactjs-popup';
import RemoveNode from '../../RemoveNode';
import { observer } from 'mobx-react-lite';
import AdmonitionTypeSelector from './AdmonitionTypeSelector';
import {
    $getSelection,
    $isElementNode,
    $isRangeSelection,
    COMMAND_PRIORITY_LOW,
    KEY_DOWN_COMMAND,
    LexicalEditor,
    LexicalNode
} from 'lexical';
import useSelectionHandler from './useSelectionHandler';

interface Props {
    mdastNode: ContainerDirective;
    parentEditor: LexicalEditor;
    lexicalNode: LexicalNode;
}

const HandledKeys = new Set(['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Backspace']);
const AdmonitionHeader = observer((props: Props) => {
    const { mdastNode, lexicalNode, parentEditor } = props;
    const updater = useMdastNodeUpdater();
    const ref = React.useRef<HTMLDivElement>(null);
    useSelectionHandler(parentEditor, lexicalNode.getKey(), 'header', ref);

    return (
        <>
            <Popup
                trigger={
                    <div className={styles.admonitionSwitcher}>
                        <Button icon={mdiChevronDown} size={0.8} iconSide="left" color="primary" />
                    </div>
                }
                on="click"
                closeOnDocumentClick
                closeOnEscape
            >
                <div className={clsx(styles.wrapper, 'card')}>
                    <div className={clsx('card__body')}>
                        <AdmonitionTypeSelector
                            currentName={mdastNode.name}
                            onChange={(name) => updater({ name })}
                        />
                    </div>
                </div>
            </Popup>
            <NestedLexicalEditor<ContainerDirective>
                block={false}
                getContent={(node) => {
                    const label = node.children.find(
                        (n) => n.type === 'paragraph' && n.data?.directiveLabel
                    ) as Paragraph;
                    return label?.children || [];
                }}
                contentEditableProps={{
                    className: styles.header,
                    ref: ref
                }}
                getUpdatedMdastNode={(mdastNode, children) => {
                    const content = mdastNode.children.filter(
                        (n) => !(n.type === 'paragraph' && n.data?.directiveLabel)
                    );
                    return {
                        ...mdastNode,
                        children: [
                            {
                                type: 'paragraph',
                                children: children as PhrasingContent[],
                                data: {
                                    directiveLabel: true
                                }
                            } satisfies Paragraph,
                            ...content
                        ]
                    };
                }}
            />
            <RemoveNode />
        </>
    );
});

export default AdmonitionHeader;
