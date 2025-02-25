/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React from 'react';
import {
    DirectiveDescriptor,
    DirectiveEditorProps,
    NestedLexicalEditor,
    useMdastNodeUpdater
} from '@mdxeditor/editor';
import { ContainerDirective, Directives } from 'mdast-util-directive';
import { BlockContent, Paragraph, PhrasingContent } from 'mdast';
import styles from './styles.module.scss';
import clsx from 'clsx';
import { mdiChevronDown, mdiChevronRight } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import RemoveNode from '../../../components/Cms/MdxEditor/RemoveNode';

export const DetailsEditor: React.ComponentType<DirectiveEditorProps<Directives>> = () => {
    const [open, setOpen] = React.useState(false);
    return (
        <details className={clsx(styles.details, 'alert', 'alert--info')} open={open}>
            <summary
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                className={clsx(styles.summary)}
            >
                <Button
                    icon={open ? mdiChevronDown : mdiChevronRight}
                    size={0.8}
                    onClick={() => setOpen((o) => !o)}
                    iconSide="left"
                    color="primary"
                />
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
            </summary>
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
        </details>
    );
};

export const DetailsDirectiveDescriptor: DirectiveDescriptor = {
    name: 'details',
    attributes: [],
    hasChildren: true,
    testNode(node) {
        return node.name === 'details';
    },
    Editor: DetailsEditor
};
