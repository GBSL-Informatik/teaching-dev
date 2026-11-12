import { Document as DocumentProps, TypeDataMapping } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import iDocument, { Source } from '@tdev-models/iDocument';
import DocumentStore from '@tdev-stores/DocumentStore';
import { ApiState } from '@tdev-stores/iStore';
import { maxBy } from 'es-toolkit/compat';
import { action, computed, observable } from 'mobx';

export interface MetaInit {
    default?: string;
}

export class CmsTextMeta extends TypeMeta<'cms_text'> {
    readonly type = 'cms_text';
    readonly default: string;

    constructor(props: Partial<MetaInit>) {
        super('cms_text');
        this.default = props.default ?? '';
    }

    @computed
    get defaultData(): TypeDataMapping['cms_text'] {
        return {
            text: this.default
        };
    }
}

class CmsText extends iDocument<'cms_text'> {
    @observable accessor text: string;
    /**
     * Unsaved edit of the text. It is kept until it is saved or discarded,
     * also when the editing ui is closed.
     */
    @observable accessor draft: string | undefined = undefined;
    constructor(props: DocumentProps<'cms_text'>, store: DocumentStore) {
        super(props, store);
        this.text = props.data?.text || '';
    }

    @action
    setData(data: TypeDataMapping['cms_text'], from: Source, updatedAt?: Date): void {
        this.text = data.text;
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    @computed
    get hasDraft() {
        return this.draft !== undefined;
    }

    @computed
    get isSaving() {
        return this.state === ApiState.SYNCING;
    }

    @action
    setDraft(text: string) {
        this.draft = text === this.text ? undefined : text;
    }

    @action
    discardDraft() {
        this.draft = undefined;
    }

    /**
     * @returns whether the draft was saved successfully
     */
    async saveDraft(): Promise<boolean> {
        const text = this.draft;
        if (text === undefined || this.isSaving) {
            return false;
        }
        this.setData({ text: text }, Source.LOCAL, new Date());
        const isSaved = !!(await this.saveNow());
        if (isSaved) {
            this.clearDraftIfUnchanged(text);
        }
        return isSaved;
    }

    get data(): TypeDataMapping['cms_text'] {
        return {
            text: this.text
        };
    }

    @computed
    get meta(): CmsTextMeta {
        if (this.root?.type === 'cms_text') {
            return this.root.meta as CmsTextMeta;
        }
        return new CmsTextMeta({});
    }

    /**
     * for now, only admins can edit cms texts
     */
    @computed
    get canEdit(): boolean {
        return !!this.store.root.userStore.current?.hasElevatedAccess;
    }

    /**
     * The draft may have been edited while it was being saved: keep those edits.
     */
    @action
    private clearDraftIfUnchanged(savedText: string) {
        if (this.draft !== savedText) {
            return;
        }
        this.draft = undefined;
    }
}

export const findMainCmsText = (documentStore: DocumentStore, documentRootId: string, userId: string) => {
    const documentRoot = documentStore.root.documentRootStore.find(documentRootId);
    return documentRoot?.allDocuments.find((doc) => doc.isMain && doc.authorId === userId) as
        CmsText | undefined;
};

export const findCmsTextsWithDraft = (documentStore: DocumentStore, documentRootIds: string[]) => {
    return documentRootIds
        .flatMap((documentRootId) => documentStore.findByDocumentRoot(documentRootId))
        .filter((doc): doc is CmsText => doc instanceof CmsText && doc.hasDraft);
};

/**
 * @returns the latest update of the user's main cms texts in the given document roots
 */
export const findLastCmsTextUpdate = (
    documentStore: DocumentStore,
    documentRootIds: string[],
    userId: string
): Date | undefined => {
    const updates = documentRootIds
        .map((documentRootId) => findMainCmsText(documentStore, documentRootId, userId)?.updatedAt)
        .filter((updatedAt) => !!updatedAt);
    return maxBy(updates, (updatedAt) => updatedAt.getTime());
};

export const createCmsText = async (
    documentStore: DocumentStore,
    documentRootId: string,
    userId: string,
    text: string
) => {
    const created = await documentStore.create({
        type: 'cms_text',
        authorId: userId,
        documentRootId: documentRootId,
        uniqOnRoot: 'main',
        data: { text: text }
    });
    return !!created;
};

/**
 * Updates the user's main cms text of the document root or creates it, when it does not exist yet.
 * @returns whether the text was saved successfully
 */
export const saveCmsText = async (
    documentStore: DocumentStore,
    documentRootId: string,
    userId: string,
    text: string
): Promise<boolean> => {
    const doc = findMainCmsText(documentStore, documentRootId, userId);
    if (!doc) {
        return createCmsText(documentStore, documentRootId, userId, text);
    }
    const isAlreadySaved = doc.text === text && !doc.isDirty;
    if (isAlreadySaved) {
        return true;
    }
    doc.setData({ text: text }, Source.LOCAL);
    return !!(await doc.saveNow());
};

export default CmsText;
