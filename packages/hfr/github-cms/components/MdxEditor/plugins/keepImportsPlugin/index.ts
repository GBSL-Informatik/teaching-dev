import { addExportVisitor$, addImportVisitor$, addLexicalNode$, realmPlugin } from '@mdxeditor/editor';
import { MdastMdxJsEsmVisitor } from './MdastMdxJsEsmVisitor';
import { MetaDataNode } from './LexicalMetaDataNode';
import { LexicalMetaDataVisitor } from './LexicalMetaDataVisitor';

export const keepImportsPlugin = realmPlugin({
    init: (realm, params) => {
        realm.pubIn({
            [addImportVisitor$]: [MdastMdxJsEsmVisitor],
            [addLexicalNode$]: [MetaDataNode],
            [addExportVisitor$]: [LexicalMetaDataVisitor]
        });
    }
});
