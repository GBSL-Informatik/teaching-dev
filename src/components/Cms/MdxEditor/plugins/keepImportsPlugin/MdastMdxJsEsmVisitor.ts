import { MdastImportVisitor } from '@mdxeditor/editor';
import { MdxjsEsm } from 'mdast-util-mdx';
import { $createMetaDataNode } from './LexicalMetaDataNode';

export const MdastMdxJsEsmVisitor: MdastImportVisitor<MdxjsEsm> = {
    testNode: 'mdxjsEsm',
    visitNode({ actions, metaData, lexicalParent, mdastParent }) {
        /**
         * ensure that the MetaDataNode is only added to the root node once
         */
        if (lexicalParent?.getType() !== 'root' || mdastParent?.type !== 'root') {
            return;
        }
        actions.addAndStepInto($createMetaDataNode({ importDeclarations: metaData.importDeclarations }));
    },
    priority: 1
};
