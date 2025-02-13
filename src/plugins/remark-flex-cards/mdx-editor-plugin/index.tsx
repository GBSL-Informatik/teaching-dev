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

export const FlexCardEditor: React.ComponentType<DirectiveEditorProps<Directives>> = ({ mdastNode }) => {
    const updater = useMdastNodeUpdater();
    const [editor] = useLexicalComposerContext();
    const isCard = mdastNode.name === 'cards';
    const keyStart = React.useRef('A');
    const parts = React.useMemo(() => {
        const current: { start: number; key: string; end?: number }[] = [];
        mdastNode.children.forEach((child, idx) => {
            if (isBreak(child)) {
                if (current.length > 0) {
                    current[current.length - 1].end = idx;
                }
                current.push({ start: idx + 1, key: `${keyStart.current}-${idx}` });
            } else if (idx === 0) {
                current.push({ start: 0, key: `${keyStart.current}-${idx}` });
            }
        });
        current[current.length - 1].end = mdastNode.children.length;
        return current;
    }, [mdastNode.children]);
    React.useEffect(() => {
        keyStart.current = String.fromCharCode(((keyStart.current.charCodeAt(0) + 1 - 65) % 26) + 65);
    }, [parts]);

    return (
        <div className={clsx(styles.flexCard, 'flex-card-container')}>
            <div className={clsx(styles.toolbar)}>
                <Popup
                    trigger={
                        <div className={styles.admonitionSwitcher}>
                            <Button icon={mdiChevronRight} size={0.8} iconSide="left" color="primary" />
                        </div>
                    }
                    on="click"
                    position={['right center']}
                    closeOnDocumentClick
                    closeOnEscape
                >
                    <Card>
                        {['flex', 'cards'].map((cardType) => (
                            <Button
                                key={cardType}
                                className={clsx(styles.userButton)}
                                iconSide="left"
                                active={mdastNode.name === cardType}
                                onClick={() => updater({ name: cardType })}
                            >
                                {cardType}
                            </Button>
                        ))}
                    </Card>
                </Popup>
            </div>
            <div className={clsx(styles.flex, 'flex', isCard && 'flex-cards')}>
                {parts.map((part) => {
                    return (
                        <ItemEditor
                            isCard={isCard}
                            {...part}
                            key={part.key}
                            onInsert={() => {
                                editor.update(() => {
                                    const end = part.end || mdastNode.children.length;
                                    updater({
                                        children: [
                                            ...mdastNode.children.slice(0, end),
                                            { type: 'leafDirective', name: 'br' },
                                            { type: 'paragraph', children: [] },
                                            ...mdastNode.children.slice(end)
                                        ] as PhrasingContent[]
                                    });
                                });
                            }}
                            onRemove={() => {
                                editor.update(() => {
                                    updater({
                                        children: [
                                            ...mdastNode.children.slice(
                                                0,
                                                part.start - (part.start > 0 ? 1 : 0)
                                            ),
                                            ...mdastNode.children.slice(part.end)
                                        ] as PhrasingContent[]
                                    });
                                });
                            }}
                        />
                    );
                })}
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
