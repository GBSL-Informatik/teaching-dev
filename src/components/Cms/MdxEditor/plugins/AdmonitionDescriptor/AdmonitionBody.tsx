/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React from 'react';
import { NestedLexicalEditor } from '@mdxeditor/editor';
import { ContainerDirective } from 'mdast-util-directive';
import { BlockContent } from 'mdast';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { LexicalEditor, LexicalNode } from 'lexical';
import useSelectionHandler from './useSelectionHandler';

interface Props {
    mdastNode: ContainerDirective;
    parentEditor: LexicalEditor;
    lexicalNode: LexicalNode;
}

const HandledKeys = new Set(['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Backspace']);
const AdmonitionBody = observer((props: Props) => {
    const { mdastNode, lexicalNode, parentEditor } = props;
    const ref = React.useRef<HTMLDivElement>(null);
    useSelectionHandler(parentEditor, lexicalNode.getKey(), 'body', ref);
    return (
        <NestedLexicalEditor<ContainerDirective>
            block
            contentEditableProps={{
                className: styles.body,
                ref: ref
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
    );
});

export default AdmonitionBody;
