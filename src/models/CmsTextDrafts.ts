import { findMainCmsText, saveCmsText } from '@tdev-models/documents/CmsText';
import DocumentStore from '@tdev-stores/DocumentStore';
import { action, computed, observable } from 'mobx';
import { computedFn } from 'mobx-utils';

interface Draft {
    documentRootId: string;
    userId: string;
    text: string;
}

const draftKey = (documentRootId: string, userId: string) => `${documentRootId}::${userId}`;

/**
 * Unsaved edits of cms texts, keyed by document root and user.
 * Lives as long as the editing ui: unsaved drafts are dropped with it.
 */
class CmsTextDrafts {
    readonly documentStore: DocumentStore;
    drafts = observable.map<string, Draft>();
    savingKeys = observable.map<string, boolean>();

    constructor(documentStore: DocumentStore) {
        this.documentStore = documentStore;
    }

    savedText = computedFn(function (this: CmsTextDrafts, documentRootId: string, userId: string): string {
        return findMainCmsText(this.documentStore, documentRootId, userId)?.text ?? '';
    });

    draftText(documentRootId: string, userId: string): string | undefined {
        return this.drafts.get(draftKey(documentRootId, userId))?.text;
    }

    isSaving(documentRootId: string, userId: string): boolean {
        return this.savingKeys.has(draftKey(documentRootId, userId));
    }

    @computed
    get hasDrafts() {
        return this.drafts.size > 0;
    }

    @computed
    get isSavingAny() {
        return this.savingKeys.size > 0;
    }

    @action
    setDraft(documentRootId: string, userId: string, text: string) {
        const key = draftKey(documentRootId, userId);
        if (text === this.savedText(documentRootId, userId)) {
            this.drafts.delete(key);
            return;
        }
        this.drafts.set(key, { documentRootId, userId, text });
    }

    @action
    discard(documentRootId: string, userId: string) {
        this.drafts.delete(draftKey(documentRootId, userId));
    }

    @action
    discardAll() {
        this.drafts.clear();
    }

    async save(documentRootId: string, userId: string) {
        const draft = this.drafts.get(draftKey(documentRootId, userId));
        if (!draft) {
            return;
        }
        await this.saveDraft(draft);
    }

    async saveAll() {
        for (const draft of [...this.drafts.values()]) {
            await this.saveDraft(draft);
        }
    }

    private async saveDraft(draft: Draft) {
        const key = draftKey(draft.documentRootId, draft.userId);
        if (this.savingKeys.has(key)) {
            return;
        }
        this.setSaving(key, true);
        try {
            const isSaved = await saveCmsText(
                this.documentStore,
                draft.documentRootId,
                draft.userId,
                draft.text
            );
            if (isSaved) {
                this.removeIfUnchanged(draft);
            }
        } finally {
            this.setSaving(key, false);
        }
    }

    @action
    private setSaving(key: string, isSaving: boolean) {
        if (isSaving) {
            this.savingKeys.set(key, true);
            return;
        }
        this.savingKeys.delete(key);
    }

    /**
     * The draft may have been edited while it was being saved: keep those edits.
     */
    @action
    private removeIfUnchanged(draft: Draft) {
        const key = draftKey(draft.documentRootId, draft.userId);
        if (this.drafts.get(key)?.text !== draft.text) {
            return;
        }
        this.drafts.delete(key);
    }
}

export default CmsTextDrafts;
