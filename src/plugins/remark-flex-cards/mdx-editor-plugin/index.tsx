import { DirectiveDescriptor } from '@mdxeditor/editor';
import FlexCardEditor from './FlexCardEditor';

export const FlexDirectiveDescriptor: DirectiveDescriptor = {
    name: 'flex',
    attributes: [],
    hasChildren: true,
    testNode(node) {
        return node.name === 'flex';
    },
    Editor: FlexCardEditor
};

export const CardsDirectiveDescriptor: DirectiveDescriptor = {
    name: 'cards',
    attributes: [],
    hasChildren: true,
    testNode(node) {
        return node.name === 'cards';
    },
    Editor: FlexCardEditor
};
