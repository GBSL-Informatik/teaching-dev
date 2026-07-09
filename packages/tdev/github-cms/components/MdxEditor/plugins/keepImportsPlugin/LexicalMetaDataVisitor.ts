import { Root } from 'mdast';
import { $isMetaDataNode, MetaDataNode } from './LexicalMetaDataNode';
import { LexicalExportVisitor } from '@mdxeditor/editor';

export const LexicalMetaDataVisitor: LexicalExportVisitor<MetaDataNode, Root> = {
    testLexicalNode: $isMetaDataNode,
    visitLexicalNode({ actions, lexicalNode }) {
        Object.entries(lexicalNode.getImportDeclarations()).forEach(([functionName, declaration]) => {
            actions.registerReferredComponent(functionName, declaration);
        });
    }
};
