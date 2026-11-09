import type { Node } from 'prosemirror-model';
import type { NodeViewConstructor } from 'prosemirror-view';
import type MdxDocument from '../models/MdxDocument';
import type { NodeName } from '../schema';
import {
    codeBlockClassName,
    CodeBlockHeader,
    CodeBlockPreview,
    FrontmatterHeader,
    MathBlockHeader,
    MathBlockPreview,
    RawBlockHeader
} from './CodeHeaders';
import { codeMirrorNodeView } from './CodeMirrorNodeView';
import ContainerDirective, { containerDirectiveClassName } from './ContainerDirective';
import FootnoteDefinition from './FootnoteDefinition';
import Image from './Image';
import InlineAtom from './InlineAtom';
import InlineMath from './InlineMath';
import JsxFlow, { jsxFlowClassName } from './JsxFlow';
import DirectiveItem, { directiveItemClassName } from './DirectiveItem';
import { directiveItemStyle, itemsDirectiveContent } from './DirectiveItem/flexLayout';
import LeafDirective from './LeafDirective';
import { reactNodeView } from './ReactNodeView';
import TextDirective from './TextDirective';

const rawBlockLanguage = (node: Node) => (node.attrs.kind === 'html' ? 'html' : 'jsx');

/**
 * All nodes which are not rendered by their `toDOM` spec.
 */
export const createNodeViews = (document: MdxDocument): Partial<Record<NodeName, NodeViewConstructor>> => ({
    code_block: codeMirrorNodeView(document, {
        language: (node) => node.attrs.lang,
        header: CodeBlockHeader,
        footer: CodeBlockPreview,
        className: codeBlockClassName
    }),
    math_block: codeMirrorNodeView(document, {
        language: () => 'latex',
        header: MathBlockHeader,
        footer: MathBlockPreview,
        className: () => 'cms-code-block'
    }),
    frontmatter: codeMirrorNodeView(document, {
        language: () => 'yaml',
        header: FrontmatterHeader,
        className: () => 'cms-code-block'
    }),
    raw_block: codeMirrorNodeView(document, {
        language: rawBlockLanguage,
        header: RawBlockHeader,
        className: () => 'cms-code-block'
    }),
    container_directive: reactNodeView(document, {
        component: ContainerDirective,
        hasContent: true,
        className: containerDirectiveClassName
    }),
    items_directive: reactNodeView(document, {
        component: ContainerDirective,
        hasContent: true,
        className: containerDirectiveClassName,
        content: itemsDirectiveContent
    }),
    directive_item: reactNodeView(document, {
        component: DirectiveItem,
        hasContent: true,
        className: directiveItemClassName,
        style: directiveItemStyle
    }),
    jsx_flow: reactNodeView(document, {
        component: JsxFlow,
        hasContent: true,
        className: jsxFlowClassName
    }),
    jsx_flow_void: reactNodeView(document, { component: JsxFlow, className: jsxFlowClassName }),
    leaf_directive: reactNodeView(document, {
        component: LeafDirective,
        className: () => 'cms-jsx'
    }),
    footnote_definition: reactNodeView(document, {
        component: FootnoteDefinition,
        hasContent: true,
        className: () => 'cms-footnote-definition'
    }),
    image: reactNodeView(document, { component: Image }),
    math_inline: reactNodeView(document, { component: InlineMath }),
    text_directive: reactNodeView(document, { component: TextDirective }),
    footnote_reference: reactNodeView(document, { component: InlineAtom }),
    raw_inline: reactNodeView(document, { component: InlineAtom })
});
