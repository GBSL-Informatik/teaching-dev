import { DocumentType } from '@tdev-api/document';
import { useStore } from '@tdev-hooks/useStore';
import MdxComment from '@tdev-models/documents/MdxComment';
import _ from 'es-toolkit/compat';

/**
 * This hook provides access to the first main document of the rootDocument.
 * This is especially useful, when the DocumentType is expected to have only
 * one main document - like a TaskState.
 */
export const useMdxComment = (
    pageId: string | undefined,
    nr: number,
    commentNr: number,
    nodeType: string
) => {
    const userStore = useStore('userStore');
    const documentRootStore = useStore('documentRootStore');
    const documentRoot = documentRootStore.find(pageId);
    if (!documentRoot || !userStore.viewedUserId) {
        return null;
    }
    const comments = documentRoot.documents.filter(
        (doc) => doc.type === DocumentType.MdxComment && doc.authorId === userStore.viewedUserId
    ) as MdxComment[];
    if (comments.length === 0) {
        return null;
    }
    const comment = comments.find((comment) => comment.nodeType === nodeType && comment.nr === nr);
    if (comment) {
        return comment;
    }
    return null;
    // /**
    //  * the mdx document structure might have changed - simply return the doument with the same commentNr...
    //  * ... or the last one
    //  */
    // const sameNr = comments.find((comment) => comment.commentNr === commentNr);
    // if (sameNr) {
    //     return sameNr;
    // }
    // return _.orderBy(comments, ['commentNr'], ['desc'])[0];
};
