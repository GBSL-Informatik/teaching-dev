interface Attribute {
    [key: string]: string | number | undefined;
}

export interface Node {
    attributes?: Attribute;
    ['#text']?: string;
    parent?: Node;
    [key: string]: Node | Node[] | string | number | Attribute | undefined;
}
export type Action = 'continue' | 'break' | 'skip' | 'skipChildren';

export type Tester = (name: string, node: Node) => boolean;
export type Visitor = (
    name: string,
    node: Node,
    index: number,
    parent?: { name: string; node: Node }
) => Action;

export const visit = (node: Node, test: Tester, visit: Visitor) => {
    const visitNode = (
        name: string,
        node: Node,
        index: number,
        parent?: { name: string; node: Node }
    ): Action => {
        if (test(name, node)) {
            const action = visit(name, node, index, parent);
            if (action === 'break') {
                return 'break';
            }
            if (action === 'skipChildren') {
                return 'continue';
            }
        }
        const childNames = Object.keys(node).filter(
            (prop) => prop !== 'attributes' && prop !== '#text' && prop !== 'parent'
        );
        childNames.forEach((name, idx) => {
            const child = node[name];
            if (Array.isArray(child)) {
                for (let i = 0; i < child.length; i++) {
                    const action = visitNode(name, child[i], i, { name, node });
                    if (action === 'break') {
                        return 'break';
                    }
                    if (action === 'skip') {
                        continue;
                    }
                }
            } else if (typeof child === 'object' && child !== null) {
                const action = visitNode(name, child, -1, { name, node });
                if (action === 'break') {
                    return 'break';
                }
                if (action === 'skip') {
                    return 'continue';
                }
            }
        });
        return 'continue';
    };

    return visitNode('root', node, -1);
};
