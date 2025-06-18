import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import {
    DocumentType,
    Document as DocumentProps,
    StateType,
    TypeDataMapping,
    Access
} from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { RWAccess } from '@tdev-models/helpers/accessPolicy';
import {
    mdiCheckboxMultipleMarkedCircleOutline,
    mdiCheckCircle,
    mdiCheckCircleOutline,
    mdiCircleMedium,
    mdiCircleSlice8,
    mdiCloseCircle,
    mdiRecordCircleOutline,
    mdiSpeedometer,
    mdiSpeedometerMedium,
    mdiSpeedometerSlow
} from '@mdi/js';

export interface MetaInit {
    readonly?: boolean;
    pagePosition?: number;
    default?: number;
}

export const DEFAULT_PROGRESS: number = 0;

export class ModelMeta extends TypeMeta<DocumentType.ProgressState> {
    readonly type = DocumentType.ProgressState;
    readonly readonly: boolean;
    readonly default: number;

    constructor(props: Partial<MetaInit>) {
        super(DocumentType.ProgressState, props.readonly ? Access.RO_User : undefined, props.pagePosition);
        this.default = props.default ?? DEFAULT_PROGRESS;
        this.readonly = !!props.readonly;
    }

    get defaultData(): TypeDataMapping[DocumentType.ProgressState] {
        return {
            progress: this.default
        };
    }
}

interface ItemState {
    path: string;
    color: string;
    state: 'done' | 'current' | 'disabled';
}

class ProgressState extends iDocument<DocumentType.ProgressState> {
    @observable accessor _progress: number = 0;
    @observable accessor _viewedIndex: number | undefined = undefined;
    @observable accessor scrollTo: boolean = false;
    @observable accessor totalSteps: number = 10;
    @observable accessor hoveredIndex: number | undefined = undefined;

    constructor(props: DocumentProps<DocumentType.ProgressState>, store: DocumentStore) {
        super(props, store);
        this._progress = props.data?.progress ?? 0;
    }

    @action
    setData(data: TypeDataMapping[DocumentType.ProgressState], from: Source, updatedAt?: Date): void {
        if (!RWAccess.has(this.root?.permission)) {
            return;
        }
        if (data.progress !== undefined) {
            this._progress = data.progress;
        }

        if (from === Source.LOCAL) {
            this.saveNow();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping[DocumentType.ProgressState] {
        return {
            progress: this._progress
        };
    }

    @computed
    get editingIconState() {
        if (this.isDone) {
            return { path: mdiCheckCircleOutline, color: 'var(--ifm-color-success)' };
        }
        const level = this.progress / this.totalSteps;
        if (this.progress === 0) {
            return { path: mdiSpeedometerSlow, color: 'var(--ifm-color-gray-700)' };
        }
        if (level < 1 / 3) {
            return { path: mdiSpeedometerSlow, color: 'var(--ifm-color-danger)' };
        }
        if (level < 2 / 3) {
            return { path: mdiSpeedometerMedium, color: 'var(--ifm-color-warning)' };
        }
        return { path: mdiSpeedometer, color: 'var(--ifm-color-success-lightest)' };
    }

    @action
    setHoveredIndex(index?: number) {
        if (this.hoveredIndex !== index) {
            this.hoveredIndex = index;
        }
    }

    @action
    setTotalSteps(totalSteps: number) {
        if (this.totalSteps !== totalSteps) {
            this.totalSteps = totalSteps;
        }
    }

    @computed
    get itemStates(): ItemState[] {
        return Array.from({ length: this.totalSteps }, (_, idx) => {
            if (idx === this.progress) {
                if (this.hoveredIndex === idx && idx === this.viewedIndex) {
                    return { path: mdiCheckCircle, color: 'var(--ifm-color-success)', state: 'current' };
                }
                if (this.hoveredIndex === idx + 1) {
                    return { path: mdiCheckCircle, color: 'var(--ifm-color-success)', state: 'current' };
                }
                if (idx === this.viewedIndex || this.hoveredIndex === idx) {
                    return {
                        path: mdiRecordCircleOutline,
                        color: 'var(--ifm-color-primary)',
                        state: 'current'
                    };
                }
                return { path: mdiCircleMedium, color: 'var(--ifm-color-primary)', state: 'current' };
            }
            if (idx === this._viewedIndex) {
                if (this.hoveredIndex === idx) {
                    return { path: mdiCircleSlice8, color: 'var(--ifm-color-primary-darker)', state: 'done' };
                }
                return { path: mdiRecordCircleOutline, color: 'var(--ifm-color-primary)', state: 'done' };
            }
            if (idx + 1 === this.totalSteps && this.isDone) {
                return { path: mdiCheckCircle, color: 'var(--ifm-color-success)', state: 'done' };
            }
            if (idx < this.progress) {
                return { path: mdiCircleMedium, color: 'var(--ifm-color-success)', state: 'done' };
            }
            if (idx === this.hoveredIndex && this.hoveredIndex === this.progress + 1) {
                return { path: mdiRecordCircleOutline, color: 'var(--ifm-color-primary)', state: 'disabled' };
            }
            return { path: mdiCircleMedium, color: 'var(--tdev-progress-rail-color)', state: 'disabled' };
        });
    }

    @computed
    get isDone(): boolean {
        return this.progress >= this.totalSteps;
    }

    iconStateForIndex(index: number): ItemState {
        return (
            this.itemStates[index] || {
                path: mdiCircleMedium,
                color: 'var(--tdev-progress-rail-color)',
                state: 'disabled'
            }
        );
    }

    @action
    onStepClicked(index: number) {
        if (index < this.progress) {
            if (this._viewedIndex === index) {
                this.setProgress(index);
            } else {
                this.setViewedIndex(index);
            }
        } else if (index === this.progress) {
            if (this.viewedIndex === index) {
                this.setProgress(index + 1);
            } else {
                this.setViewedIndex(index);
            }
        } else if (index === this.progress + 1) {
            this.setProgress(index);
        }
    }

    @computed
    get isViewingLatest(): boolean {
        return this._viewedIndex === undefined || this._viewedIndex === this.progress;
    }

    @computed
    get viewedIndex(): number {
        return Math.min(this._viewedIndex ?? this.progress, this.progress);
    }

    @computed
    get progress(): number {
        return this.derivedData.progress ?? this.meta.default;
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === DocumentType.ProgressState) {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }

    @action
    setScrollTo(scrollTo: boolean) {
        this.scrollTo = scrollTo;
    }

    @action
    setViewedIndex(index?: number) {
        if (this._viewedIndex !== index) {
            this._viewedIndex = index;
        }
    }

    @action
    setProgress(progress: number) {
        if (this._viewedIndex !== undefined) {
            this.setViewedIndex();
        }
        this.setData(
            {
                progress: progress
            },
            Source.LOCAL,
            new Date()
        );
    }
}

export default ProgressState;
