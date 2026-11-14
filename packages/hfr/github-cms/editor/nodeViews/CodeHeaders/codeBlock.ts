import type { Node } from 'prosemirror-model';

export const isMermaid = (node: Node) => node.attrs.lang === 'mermaid';

/** mermaid diagrams are edited next to their preview */
export const codeBlockClassName = (node: Node) =>
    isMermaid(node) ? 'cms-code-block cms-code-block--split' : 'cms-code-block';
