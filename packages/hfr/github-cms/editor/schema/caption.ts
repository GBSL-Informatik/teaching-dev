import { type NodeSpec, Schema } from 'prosemirror-model';
import { schema } from '.';

const nodeSpec = (name: string): NodeSpec => schema.spec.nodes.get(name)!;

/** inline atoms are shown as their markdown, there are no node views in captions */
const asMarkdown = (spec: NodeSpec, markdown: NodeSpec['toDOM']): NodeSpec => ({ ...spec, toDOM: markdown });

/**
 * The schema of image captions: a single paragraph with inline content, but no images or
 * line breaks. See `remark-images`, which renders the markdown of the alt text as caption.
 */
export const captionSchema = new Schema({
    nodes: {
        doc: { content: 'paragraph' },
        paragraph: nodeSpec('paragraph'),
        text: nodeSpec('text'),
        math_inline: asMarkdown(nodeSpec('math_inline'), (node) => [
            'code',
            { class: 'cms-raw' },
            `$${node.attrs.value}$`
        ]),
        text_directive: asMarkdown(nodeSpec('text_directive'), (node) => [
            'code',
            { class: 'cms-raw' },
            `:${node.attrs.name}[${node.attrs.label}]`
        ]),
        footnote_reference: nodeSpec('footnote_reference'),
        raw_inline: nodeSpec('raw_inline')
    },
    marks: schema.spec.marks
});
