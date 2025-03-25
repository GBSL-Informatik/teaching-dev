/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { PhrasingContent } from 'mdast';
import React from 'react';
import { Directives } from 'mdast-util-directive';
import { DirectiveDescriptor, DirectiveEditorProps, NestedLexicalEditor } from '@mdxeditor/editor';
import styles from './styles.module.scss';
import GenericAttributeEditor from '../../GenericAttributeEditor';
import { useDirectiveAttributeEditor } from '../../hooks/useDirectiveAttributeEditor';
import Card from '@tdev-components/shared/Card';
import clsx from 'clsx';
import MyAttributes from '../../GenericAttributeEditor/MyAttributes';
import RemoveNode from '../../RemoveNode';

/**
 * A generic editor that can be used as an universal UI for any directive.
 * Allows editing of the directive content and properties.
 * Use this editor for the {@link DirectiveDescriptor} Editor option.
 * @group Directive
 */
export const GenericDirectiveDescriptor: DirectiveDescriptor = {
    name: 'directive',
    testNode(node) {
        return node.type !== 'textDirective';
    },
    attributes: [],
    hasChildren: true,
    Editor: ({ mdastNode, descriptor }: DirectiveEditorProps) => {
        const properties = React.useMemo(() => {
            return descriptor.attributes.reduce<Record<string, string>>((acc, attributeName) => {
                acc[attributeName] = mdastNode.attributes?.[attributeName] ?? '';
                return acc;
            }, {});
        }, [mdastNode, descriptor]);
        const { directiveAttributes, onUpdate } = useDirectiveAttributeEditor([], mdastNode.attributes);
        if (mdastNode.type === 'textDirective') {
            return null;
        }

        return (
            <Card
                header={
                    <div className={clsx(styles.actions)}>
                        <GenericAttributeEditor
                            values={{ ...directiveAttributes, className: directiveAttributes.class }}
                            onUpdate={onUpdate}
                            properties={[]}
                            canExtend
                        />
                        <MyAttributes
                            title={`::${mdastNode.type === 'containerDirective' ? ':' : ''}${mdastNode.name}`}
                            attributes={directiveAttributes}
                        />
                        <RemoveNode />
                    </div>
                }
            >
                <NestedLexicalEditor<Directives>
                    block={mdastNode.type === 'containerDirective'}
                    getContent={(node) => node.children as PhrasingContent[]}
                    getUpdatedMdastNode={(mdastNode, children: any) => {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        return { ...mdastNode, children };
                    }}
                />
            </Card>
        );
    }
};
