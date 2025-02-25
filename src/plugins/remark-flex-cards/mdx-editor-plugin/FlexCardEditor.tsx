import React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { DirectiveEditorProps, useMdastNodeUpdater } from '@mdxeditor/editor';
import { LeafDirective, Directives } from 'mdast-util-directive';
import { BlockContent, PhrasingContent } from 'mdast';
import clsx from 'clsx';
import styles from './styles.module.scss';
import Popup from 'reactjs-popup';
import Button from '@tdev-components/shared/Button';
import { mdiChevronRight } from '@mdi/js';
import Card from '@tdev-components/shared/Card';
import ItemEditor from './ItemEditor';

const isBreak = (node?: BlockContent | any): node is LeafDirective => {
    if (!node) {
        return false;
    }
    return node.type === 'leafDirective' && node.name === 'br';
};
const FlexCardEditor: React.ComponentType<DirectiveEditorProps<Directives>> = ({ mdastNode }) => {
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

export default FlexCardEditor;
