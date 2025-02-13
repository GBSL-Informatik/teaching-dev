import { JsxComponentDescriptor, NestedLexicalEditor } from '@mdxeditor/editor';
import { MdxJsxFlowElement } from 'mdast-util-mdx';
import DefinitionList from '@tdev-components/DefinitionList';

export const DeflistDescriptor: JsxComponentDescriptor = {
    name: 'Dl',
    kind: 'flow',
    hasChildren: true,
    source: undefined,
    props: [],
    Editor: () => {
        return (
            <DefinitionList>
                <NestedLexicalEditor<MdxJsxFlowElement>
                    getContent={(node) => node.children}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    getUpdatedMdastNode={(mdastNode, children: any) => {
                        return { ...mdastNode, children };
                    }}
                />
            </DefinitionList>
        );
    }
};
export const DtDescriptor: JsxComponentDescriptor = {
    name: 'dt',
    kind: 'flow',
    hasChildren: true,
    source: undefined,
    props: [],
    Editor: () => {
        return (
            <dt>
                <NestedLexicalEditor<MdxJsxFlowElement>
                    getContent={(node) => node.children}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    getUpdatedMdastNode={(mdastNode, children: any) => {
                        return { ...mdastNode, children };
                    }}
                />
            </dt>
        );
    }
};
export const DdDescriptor: JsxComponentDescriptor = {
    name: 'dd',
    kind: 'flow',
    hasChildren: true,
    source: undefined,
    props: [],
    Editor: () => {
        return (
            <dd>
                <NestedLexicalEditor<MdxJsxFlowElement>
                    getContent={(node) => node.children}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    getUpdatedMdastNode={(mdastNode, children: any) => {
                        return { ...mdastNode, children };
                    }}
                />
            </dd>
        );
    }
};
