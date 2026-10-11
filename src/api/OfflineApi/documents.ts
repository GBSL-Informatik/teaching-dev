import type { Document, DocumentType } from '@tdev-api/document';

type OfflineDocument = Document<DocumentType>;

export class OfflineDocumentError extends Error {
    constructor(
        message: string,
        readonly status = 403
    ) {
        super(message);
    }
}

export const compareDocuments = (a: OfflineDocument, b: OfflineDocument) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export const cleanDocument = <T extends DocumentType>(document: Document<T>): Document<T> => {
    const cleaned = { ...document };
    for (const key of ['parentId', 'uniqOnRoot', 'uniqOnParent'] as const) {
        if (!cleaned[key]) {
            delete cleaned[key];
        }
    }
    return cleaned;
};

export const sameDocumentScope = (a: OfflineDocument, b: OfflineDocument) =>
    a.documentRootId === b.documentRootId && a.authorId === b.authorId && a.type === b.type;

export const matchingConstraint = (a: OfflineDocument, b: OfflineDocument) =>
    sameDocumentScope(a, b) &&
    ((a.uniqOnRoot != null && a.uniqOnRoot === b.uniqOnRoot) ||
        (!!a.parentId &&
            a.parentId === b.parentId &&
            a.uniqOnParent != null &&
            a.uniqOnParent === b.uniqOnParent));

export const assertUniqueDocument = (documents: OfflineDocument[], document: OfflineDocument) => {
    if (documents.some((other) => other.id !== document.id && matchingConstraint(document, other))) {
        throw new OfflineDocumentError('Unique constraint violation');
    }
};

export const assertUniqueDocuments = (documents: OfflineDocument[]) => {
    const roots = new Set<string>();
    const parents = new Set<string>();
    for (const document of documents) {
        const scope = [document.documentRootId, document.authorId, document.type];
        for (const [key, keys] of [
            [document.uniqOnRoot != null ? JSON.stringify([...scope, document.uniqOnRoot]) : null, roots],
            [
                document.parentId && document.uniqOnParent != null
                    ? JSON.stringify([...scope, document.parentId, document.uniqOnParent])
                    : null,
                parents
            ]
        ] as const) {
            if (key !== null) {
                if (keys.has(key)) {
                    throw new OfflineDocumentError('Unique constraint violation');
                }
                keys.add(key);
            }
        }
    }
};

export const deleteDocumentTree = (documents: OfflineDocument[], ids: string[]) => {
    const deleted = new Set(ids);
    let changed = true;
    while (changed) {
        changed = false;
        for (const document of documents) {
            if (document.parentId && deleted.has(document.parentId) && !deleted.has(document.id)) {
                deleted.add(document.id);
                changed = true;
            }
        }
    }
    return documents.filter((document) => !deleted.has(document.id));
};

/** Preserve the oldest identity and the largest payload, matching the API's legacy cleanup. */
export const consolidateDocuments = (documents: OfflineDocument[], candidates: OfflineDocument[]) => {
    const ordered = [...candidates].sort(compareDocuments);
    const retained = ordered[0];
    let data = retained.data;
    const size = (value: OfflineDocument['data']) => (value ? JSON.stringify(value).length : 0);
    for (const document of ordered) {
        if (size(document.data) > size(data)) {
            data = document.data;
        }
    }
    const removed = new Set(ordered.slice(1).map((document) => document.id));
    const moved = documents.map((document) => {
        if (document.id === retained.id) {
            return { ...document, data };
        }
        if (document.parentId && removed.has(document.parentId) && document.uniqOnParent == null) {
            return { ...document, parentId: retained.id };
        }
        return document;
    });
    return { documents: deleteDocumentTree(moved, [...removed]), id: retained.id };
};

const questionId = (document: OfflineDocument) => {
    if (document.type !== 'choice_answer' && document.type !== 'true_false_answer') {
        return undefined;
    }
    const data = document.data;
    return data && 'qid' in data && typeof data.qid === 'string' && data.qid ? data.qid : undefined;
};

export const linkLegacyQuizAnswers = (documents: OfflineDocument[]) =>
    documents.map((document) => {
        if (document.parentId || !questionId(document)) {
            return document;
        }
        const quiz = documents
            .filter(
                (other) =>
                    other.type === 'quiz' &&
                    other.documentRootId === document.documentRootId &&
                    other.authorId === document.authorId
            )
            .sort(compareDocuments)[0];
        return quiz ? { ...document, parentId: quiz.id } : document;
    });

export const constrainSingletonRoots = (documents: OfflineDocument[]) => {
    const groups = new Map<string, OfflineDocument[]>();
    for (const document of documents) {
        const key = JSON.stringify([document.documentRootId, document.authorId]);
        const group = groups.get(key) ?? [];
        group.push(document);
        groups.set(key, group);
    }
    const excluded = new Set(['dynamic_document_roots', 'mdx_comment', 'cms_text', 'script_version']);
    const mainIds = new Set(
        [...groups.values()]
            .filter(
                (group) =>
                    group.length === 1 &&
                    !group[0].parentId &&
                    group[0].uniqOnRoot === undefined &&
                    !excluded.has(group[0].type)
            )
            .map((group) => group[0].id)
    );
    return documents.map((document) =>
        mainIds.has(document.id) ? { ...document, uniqOnRoot: 'main' } : document
    );
};

export const constrainLegacyQuizAnswers = (documents: OfflineDocument[]) => {
    const groups = new Map<string, OfflineDocument[]>();
    for (const document of documents) {
        const qid = questionId(document);
        if (!document.parentId || !qid || document.uniqOnParent !== undefined) {
            continue;
        }
        const key = JSON.stringify([
            document.documentRootId,
            document.authorId,
            document.type,
            document.parentId,
            qid
        ]);
        const group = groups.get(key) ?? [];
        group.push(document);
        groups.set(key, group);
    }
    let migrated = documents;
    for (const candidates of groups.values()) {
        const first = candidates[0];
        const qid = questionId(first)!;
        const existing = migrated.find(
            (document) =>
                sameDocumentScope(document, first) &&
                document.parentId === first.parentId &&
                document.uniqOnParent === qid
        );
        // Explicit constraints take precedence over legacy records.
        if (existing) {
            continue;
        }
        const liveCandidates = candidates.filter((candidate) =>
            migrated.some((doc) => doc.id === candidate.id)
        );
        if (liveCandidates.length === 0) {
            continue;
        }
        const consolidated = consolidateDocuments(migrated, liveCandidates);
        migrated = consolidated.documents.map((document) =>
            document.id === consolidated.id ? { ...document, uniqOnParent: qid } : document
        );
    }
    return migrated;
};

export const migrateLegacyDocuments = (documents: OfflineDocument[]) => {
    const migrated = constrainLegacyQuizAnswers(constrainSingletonRoots(linkLegacyQuizAnswers(documents)));
    assertUniqueDocuments(migrated);
    return migrated;
};
