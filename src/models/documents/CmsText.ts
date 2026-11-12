import { Document as DocumentProps, TypeDataMapping } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import iDocument, { Source } from '@tdev-models/iDocument';
import DocumentStore from '@tdev-stores/DocumentStore';
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
}

export const findMainCmsText = (documentStore: DocumentStore, documentRootId: string, userId: string) => {
    const documentRoot = documentStore.root.documentRootStore.find(documentRootId);
    return documentRoot?.allDocuments.find((doc) => doc.isMain && doc.authorId === userId) as
        CmsText | undefined;
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
        const created = await documentStore.create({
            type: 'cms_text',
            authorId: userId,
            documentRootId: documentRootId,
            uniqOnRoot: 'main',
            data: { text: text }
        });
        return !!created;
    }
    const isAlreadySaved = doc.text === text && !doc.isDirty;
    if (isAlreadySaved) {
        return true;
    }
    doc.setData({ text: text }, Source.LOCAL);
    return !!(await doc.saveNow());
};

export default CmsText;
