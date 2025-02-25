/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React from 'react';
import { DirectiveDescriptor, NestedLexicalEditor, useMdastNodeUpdater } from '@mdxeditor/editor';
import { ContainerDirective } from 'mdast-util-directive';
import { BlockContent, Paragraph, PhrasingContent, RootContent } from 'mdast';
import styles from './styles.module.scss';
import clsx from 'clsx';
import Admonition from '@theme/Admonition';
import { mdiChevronDown } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import Popup from 'reactjs-popup';
import RemoveNode from '../../RemoveNode';
import { observer } from 'mobx-react-lite';
import AdmonitionTypeSelector from './AdmonitionTypeSelector';

/** @internal */
export const ADMONITION_TYPES = ['note', 'tip', 'info', 'warning', 'danger'] as const;

/** @internal */
export type AdmonitionKind = (typeof ADMONITION_TYPES)[number];

/**
 * Pass this descriptor to the `directivesPlugin` `directiveDescriptors` parameter to enable {@link https://docusaurus.io/docs/markdown-features/admonitions | markdown admonitions}.
 *
 * @example
 * ```tsx
 * <MDXEditor
 *  plugins={[
 *   directivesPlugin({ directiveDescriptors: [ AdmonitionDirectiveDescriptor] }),
 *  ]} />
 * ```
 * @group Directive
 */
export const AdmonitionDirectiveDescriptor: DirectiveDescriptor = {
    name: 'admonition',
    attributes: [],
    hasChildren: true,
    testNode(node) {
        return ADMONITION_TYPES.includes(node.name as AdmonitionKind);
    },
    Editor: observer(({ mdastNode }) => {
        const updater = useMdastNodeUpdater();
        return (
            <Admonition
                type={mdastNode.name}
                className={clsx(styles.admonition)}
                title={
                    <>
                        <Popup
                            trigger={
                                <div className={styles.admonitionSwitcher}>
                                    <Button
                                        icon={mdiChevronDown}
                                        size={0.8}
                                        iconSide="left"
                                        color="primary"
                                    />
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
                                className: styles.header
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
                }
            >
                <NestedLexicalEditor<ContainerDirective>
                    block
                    contentEditableProps={{
                        className: styles.body
                    }}
                    getContent={(node) => {
                        const content = node.children.filter(
                            (n) => !(n.data as undefined | { directiveLabel?: boolean })?.directiveLabel
                        );
                        return content;
                    }}
                    getUpdatedMdastNode={(mdastNode, children) => {
                        const label = mdastNode.children.filter(
                            (n) => (n.data as undefined | { directiveLabel?: boolean })?.directiveLabel
                        );
                        const composed = [...label, ...children] as BlockContent[];
                        return { ...mdastNode, children: composed };
                    }}
                />
            </Admonition>
        );
    })
};
