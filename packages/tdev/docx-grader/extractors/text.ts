import { Node, visit } from '..';

const extractor = (node: Node) => {
    const parts: string[] = [];
    visit(
        node,
        (n) => n === 'w:p',
        (_, node) => {
            const inlineParts: string[] = [];
            visit(
                node,
                (n) => n === 'w:t',
                (_, node) => {
                    if (node['#text'] !== undefined) {
                        inlineParts.push(node['#text']);
                    }
                    return 'skipChildren';
                }
            );
            parts.push(inlineParts.join(''));
            return 'continue';
        }
    );
    return parts.join('\n');
};

export default extractor;
