import type { Node } from 'prosemirror-model';
import { schema } from '../schema';
import { captionSchema } from '../schema/caption';
import { parseMarkdown } from './parse';
import { serializeMarkdown } from './serialize';

const plainCaption = (markdown: string) => {
    const text = markdown ? captionSchema.text(markdown) : undefined;
    return captionSchema.node('doc', null, captionSchema.node('paragraph', null, text));
};

/**
 * Parses the markdown of an image caption to a document of the `captionSchema`.
 * Captions which are not a single paragraph of inline content (e.g. `# Title`) are kept as plain text.
 */
export const parseCaption = (markdown: string): Node => {
    try {
        const { doc } = parseMarkdown(markdown);
        const paragraph = doc.firstChild;
        if (doc.childCount !== 1 || paragraph?.type !== schema.nodes.paragraph) {
            return plainCaption(markdown);
        }
        return captionSchema.nodeFromJSON({ type: 'doc', content: [paragraph.toJSON()] });
    } catch {
        // invalid mdx or content which is not allowed in captions
        return plainCaption(markdown);
    }
};

export const serializeCaption = (caption: Node): string => {
    const doc = schema.nodeFromJSON(caption.toJSON());
    return serializeMarkdown(doc, '').trim();
};
