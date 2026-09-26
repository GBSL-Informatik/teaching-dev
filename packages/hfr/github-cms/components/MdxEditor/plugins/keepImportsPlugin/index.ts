import { addExportVisitor$, addImportVisitor$, addLexicalNode$, realmPlugin } from '@mdxeditor/editor';
import { MetaDataNode } from './LexicalMetaDataNode';
import { LexicalMetaDataVisitor } from './LexicalMetaDataVisitor';
import { MdastMdxJsEsmVisitor } from './MdastMdxJsEsmVisitor';

export const keepImportsPlugin = realmPlugin({
    init: (realm, params) => {
        realm.pubIn({
            [addImportVisitor$]: [MdastMdxJsEsmVisitor],
            [addLexicalNode$]: [MetaDataNode],
            [addExportVisitor$]: [LexicalMetaDataVisitor]
        });
    }
});
