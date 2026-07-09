/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { PhrasingContent } from 'mdast';
import { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx';
import React from 'react';
import styles from './styles.module.scss';
import { JsxComponentDescriptor, NestedLexicalEditor } from '@mdxeditor/editor';
import { useAttributeEditorInNestedEditor } from '../../hooks/useAttributeEditorInNestedEditor';
import clsx from 'clsx';
import GenericAttributeEditor from '../../GenericAttributeEditor';
import RemoveNode from '../../RemoveNode';
import MyAttributes from '../../GenericAttributeEditor/MyAttributes';
import CodeBlock from '@theme/CodeBlock';

/**
 * A generic editor that can be used as an universal UI for any JSX element.
 * Allows editing of the element content and properties.
 * Use this editor for the {@link JsxComponentDescriptor} Editor option.
 * @group JSX
 */
export const GenericJsxDescriptor: JsxComponentDescriptor = {
    name: '*',
    kind: 'flow',
    props: [],
    Editor: ({ mdastNode, descriptor }) => {
        const { onUpdate, values } = useAttributeEditorInNestedEditor([], mdastNode.attributes);
        const props = React.useMemo(() => {
            return Object.entries(values)
                .map(([k, v]) =>
                    /^\s*(\[|\{)/.test(v)
                        ? `${k}={${v}}`
                        : /^\d+(\.\d+)?$/.test(v)
                          ? `${k}={${v}}`
                          : `${k}="${v}"`
                )
                .join(' ');
        }, [values]);

        if (mdastNode.children && mdastNode.children.length > 0) {
            return (
                <div className={clsx(styles.jsxFlow)}>
                    <CodeBlock
                        language="jsx"
                        className={clsx(styles.codeBlock, styles.top)}
                        title={
                            (
                                <div className={clsx(styles.actions)}>
                                    <GenericAttributeEditor
                                        values={values}
                                        onUpdate={onUpdate}
                                        properties={[]}
                                        canExtend
                                    />
                                    <MyAttributes title={`<${mdastNode.name} />`} attributes={values} />
                                    <RemoveNode />
                                </div>
                            ) as any
                        }
                    >
                        {`<${mdastNode.name} ${props}>`}
                    </CodeBlock>
                    <div className={clsx(styles.content)}>
                        <NestedLexicalEditor<MdxJsxTextElement | MdxJsxFlowElement>
                            block={descriptor.kind === 'flow'}
                            getContent={(node) => node.children as PhrasingContent[]}
                            getUpdatedMdastNode={(mdastNode, children) => {
                                return { ...mdastNode, children } as any;
                            }}
                        />
                    </div>
                    <CodeBlock language="jsx" className={clsx(styles.codeBlock, styles.bottom)}>
                        {`</${mdastNode.name}>`}
                    </CodeBlock>
                </div>
            );
        }

        return (
            <CodeBlock
                language="jsx"
                title={
                    (
                        <div className={clsx(styles.actions)}>
                            <GenericAttributeEditor
                                values={values}
                                onUpdate={onUpdate}
                                properties={[]}
                                canExtend
                            />
                            <MyAttributes title={`<${mdastNode.name} />`} attributes={values} />
                            <RemoveNode />
                        </div>
                    ) as any
                }
            >
                {`<${mdastNode.name} ${props} />`}
            </CodeBlock>
        );
    }
};
