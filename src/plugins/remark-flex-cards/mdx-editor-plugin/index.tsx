/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React from 'react';
import {
    DirectiveDescriptor,
    DirectiveEditorProps,
    NestedLexicalEditor,
    useMdastNodeUpdater
} from '@mdxeditor/editor';
import { ContainerDirective, LeafDirective, Directives } from 'mdast-util-directive';
import { BlockContent, PhrasingContent } from 'mdast';
import styles from './styles.module.scss';
import clsx from 'clsx';
import { mdiChevronRight, mdiMinusBoxOutline, mdiPlusBoxOutline } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import Popup from 'reactjs-popup';
import Card from '@tdev-components/shared/Card';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import FlexCardEditor from './FlexCardEditor';

const isBreak = (node?: BlockContent | any): node is LeafDirective => {
    if (!node) {
        return false;
    }
    return node.type === 'leafDirective' && node.name === 'br';
};

interface ItemProps {
    isCard: boolean;
    start: number;
    end?: number;
    onInsert: () => void;
    onRemove: () => void;
}
const ItemEditor = (props: ItemProps) => {
    const { isCard, start, end } = props;
    return (
        <div className={clsx(styles.item, 'item', isCard && 'card')}>
            <div className={clsx(styles.editor, isCard ? 'card__body' : 'content')}>
                <NestedLexicalEditor<ContainerDirective>
                    block
                    getContent={(node) => {
                        const content = node.children.slice(start, end);
                        return content;
                    }}
                    getUpdatedMdastNode={(mdastNode, children) => {
                        const composed = [
                            ...mdastNode.children.slice(0, start),
                            ...children,
                            ...mdastNode.children.slice(end)
                        ] as BlockContent[];
                        return { ...mdastNode, children: composed };
                    }}
                />
            </div>
            <div className={clsx(styles.actions)}>
                <Button
                    icon={mdiPlusBoxOutline}
                    className={clsx(styles.add, styles.button)}
                    color="green"
                    onClick={props.onInsert}
                    size={SIZE_S}
                />
                <Button
                    icon={mdiMinusBoxOutline}
                    className={clsx(styles.remove, styles.button)}
                    size={SIZE_S}
                    color="red"
                    onClick={props.onRemove}
                />
            </div>
        </div>
    );
};

export const FlexDirectiveDescriptor: DirectiveDescriptor = {
    name: 'flex',
    attributes: [],
    hasChildren: true,
    testNode(node) {
        return node.name === 'flex';
    },
    Editor: FlexCardEditor
};

export const CardsDirectiveDescriptor: DirectiveDescriptor = {
    name: 'cards',
    attributes: [],
    hasChildren: true,
    testNode(node) {
        return node.name === 'cards';
    },
    Editor: FlexCardEditor
};
