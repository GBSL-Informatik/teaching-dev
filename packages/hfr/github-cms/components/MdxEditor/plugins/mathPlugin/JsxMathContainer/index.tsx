import { NestedEditorsContext, VoidEmitter } from '@mdxeditor/editor';
import type { EditorConfig, LexicalEditor } from 'lexical';
import { InlineMath, Math } from 'mdast-util-math';
import { MathNode } from '../MathNode';
import BlockMathEditor from './BlockMathEditor';
import InlineMathEditor from './InlineMathEditor';

interface Props {
    /** The Lexical editor that contains the node */
    parentEditor: LexicalEditor;
    /** The Lexical node that is being edited */
    lexicalJsxNode: MathNode;
    /** The MDAST node that is being edited */
    mdastNode: Math | InlineMath;
    config: EditorConfig;
    focusEmitter: VoidEmitter;
}

const JsxMathContainer = (props: Props) => {
    const { mdastNode } = props;

    return (
        <NestedEditorsContext.Provider
            value={{
                config: props.config,
                focusEmitter: props.focusEmitter,
                mdastNode: mdastNode,
                parentEditor: props.parentEditor,
                lexicalNode: props.lexicalJsxNode
            }}
        >
            {mdastNode.type === 'inlineMath' ? (
                <InlineMathEditor mdastNode={mdastNode} />
            ) : (
                <BlockMathEditor mdastNode={mdastNode} />
            )}
        </NestedEditorsContext.Provider>
    );
};

export default JsxMathContainer;
