import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { iTaskableDocument } from '@tdev-models/iTaskableDocument';
import { Document as DocumentProps, TypeDataMapping, Factory } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { ModelMeta } from './ModelMeta';
import { mdiBookCheck, mdiBookCheckOutline, mdiBookEducation, mdiBookOpenVariantOutline } from '@mdi/js';

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

    get progress() {
        return this.read ? 2 : this.readTime > this.meta.minReadTime ? 1 : 0;
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
        if (this.readTime < this.meta.minReadTime) {
            return {
                path: mdiBookOpenVariantOutline,
                color: 'var(--ifm-color-grey-500)'
            };
        }
        return {
            path: mdiBookEducation,
            color: 'var(--ifm-color-warning)'
        };
    }

    @action
    setScrollTo(scrollTo: boolean) {
        this.scrollTo = scrollTo;
    }

    @computed
    get fReadTime(): string {
        const hours = Math.floor(this.readTime / 3600);
        const minutes = Math.floor((this.readTime % 3600) / 60);
        const seconds = this.readTime % 60;
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    @computed
    get fReadTimeLong(): string {
        const hours = Math.floor(this.readTime / 3600);
        const minutes = Math.floor((this.readTime % 3600) / 60);
        const seconds = this.readTime % 60;
        if (hours > 0) {
            return `${hours} Stunden ${minutes.toString().padStart(2, '0')} Minuten ${seconds.toString().padStart(2, '0')} Sekunden`;
        }
        return `${minutes} Minuten ${seconds.toString().padStart(2, '0')} Sekunden`;
    }

    @action
    setReadState(read: boolean) {
        this.read = read;
        this.save();
    }

    @action
    incrementReadTime(by: number = 1) {
        this.readTime += by;
        this.save();
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
