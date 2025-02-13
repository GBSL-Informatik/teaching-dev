/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React from 'react';
import { DirectiveDescriptor, NestedLexicalEditor, useMdastNodeUpdater } from '@mdxeditor/editor';
import { ContainerDirective } from 'mdast-util-directive';
import { BlockContent, Paragraph, PhrasingContent } from 'mdast';
import styles from './styles.module.scss';
import clsx from 'clsx';
import { mdiChevronDown } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import Popup from 'reactjs-popup';
import DefBox from '@tdev-components/CodeDefBox';
import DefHeading from '@tdev-components/CodeDefBox/DefHeading';
import RemoveJsxNode from '@tdev-components/Cms/MdxEditor/RemoveJsxNode';
import DefContent from '@tdev-components/CodeDefBox/DefContent';
import AdmonitionTypeSelector from '@tdev-components/Cms/MdxEditor/plugins/AdmonitionDescriptor/AdmonitionTypeSelector';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';

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
export const CodeDefBoxDirectiveDescriptor: DirectiveDescriptor = {
    name: 'def',
    attributes: [],
    hasChildren: true,
    testNode(node) {
        return node.name === 'def';
    },
    Editor: observer(({ mdastNode }) => {
        const updater = useMdastNodeUpdater();
        const cmsStore = useStore('cmsStore');
        React.useEffect(() => {
            cmsStore.addAdmonitionType('def');
        }, []);
        return (
            <DefBox className={clsx(styles.def)}>
                <DefHeading className={clsx(styles.header)}>
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
                    <RemoveJsxNode />
                </DefHeading>
                <DefContent className={clsx(styles.content)}>
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
                </DefContent>
            </DefBox>
        );
    })
};
