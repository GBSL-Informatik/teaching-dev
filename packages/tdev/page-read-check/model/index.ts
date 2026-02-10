import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { iTaskableDocument } from '@tdev-models/iTaskableDocument';
import { Document as DocumentProps, TypeDataMapping, Factory } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { ModelMeta } from './ModelMeta';
import { mdiBookCheck, mdiBookCheckOutline, mdiBookEducation, mdiBookOpenVariantOutline } from '@mdi/js';
import { fSeconds, fSecondsLong } from '../helpers/time';

export const createModel: Factory = (data, store) => {
    return new PageReadChecker(data as DocumentProps<'page_read_check'>, store);
};

class PageReadChecker extends iDocument<'page_read_check'> implements iTaskableDocument<'page_read_check'> {
    @observable accessor readTime: number = 0;
    @observable accessor read: boolean = false;
    @observable accessor scrollTo: boolean = false;
    constructor(props: DocumentProps<'page_read_check'>, store: DocumentStore) {
        super(props, store);
        this.readTime = props.data.readTime || 0;
        this.read = props.data.read || false;
    }

    @action
    setData(data: Partial<TypeDataMapping['page_read_check']>, from: Source, updatedAt?: Date): void {
        if (data.readTime !== undefined) {
            this.readTime = data.readTime;
        }
        if (data.read !== undefined) {
            this.read = data.read;
        }
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get isDone() {
        return this.read;
    }

    @computed
    get canUnlock() {
        return this.readTime >= this.meta.minReadTime;
    }

    @computed
    get progress() {
        return this.read ? 2 : this.canUnlock ? 1 : 0;
    }

    get totalSteps() {
        return 2;
    }

    @computed
    get editingIconState() {
        if (this.read) {
            return {
                path: mdiBookCheck,
                color: 'var(--ifm-color-success)'
            };
        }
        if (this.canUnlock) {
            return {
                path: mdiBookEducation,
                color: 'var(--ifm-color-warning)'
            };
        }
        return {
            path: mdiBookOpenVariantOutline,
            color: 'var(--ifm-color-grey-500)'
        };
    }

    @action
    setScrollTo(scrollTo: boolean) {
        this.scrollTo = scrollTo;
    }

    @computed
    get fReadTime(): string {
        return fSeconds(this.readTime);
    }

    @computed
    get fReadTimeLong(): string {
        return fSecondsLong(this.readTime);
    }

    @action
    setReadState(read: boolean) {
        this.read = read;
        this.saveNow();
    }

    @action
    incrementReadTime(by: number = 1) {
        this.readTime += by;
        this.saveNow();
    }

    get data(): TypeDataMapping['page_read_check'] {
        return {
            readTime: this.readTime,
            read: this.read
        };
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === 'page_read_check') {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }
}

export default PageReadChecker;
