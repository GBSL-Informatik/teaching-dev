import { type NodeSpec, Schema } from 'prosemirror-model';
import { schema } from '.';

const nodeSpec = (name: string): NodeSpec => schema.spec.nodes.get(name)!;

/**
 * The schema of image captions: a single paragraph with inline content, but no images or
 * line breaks. See `remark-images`, which renders the markdown of the alt text as caption.
 */
export const captionSchema = new Schema({
    nodes: {
        doc: { content: 'paragraph' },
        paragraph: nodeSpec('paragraph'),
        text: nodeSpec('text'),
        math_inline: nodeSpec('math_inline'),
        text_directive: nodeSpec('text_directive'),
        footnote_reference: nodeSpec('footnote_reference'),
        raw_inline: nodeSpec('raw_inline')
    },
    marks: schema.spec.marks
});
