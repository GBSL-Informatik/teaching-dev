import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { DocumentType, Document as DocumentProps, TypeDataMapping, Access } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { RWAccess } from '@tdev-models/helpers/accessPolicy';
import { mdiCheckCircleOutline, mdiSpeedometer, mdiSpeedometerMedium, mdiSpeedometerSlow } from '@mdi/js';
import { IfmColors } from '@tdev-components/shared/Colors';
import Step from './Step';

export interface MetaInit {
    readonly?: boolean;
    pagePosition?: number;
    default?: number;
    confirm?: boolean;
    allOpen?: boolean;
    preventSteppingBack?: boolean;
    preventTogglingFutureSteps?: boolean;
    preventTogglingPastSteps?: boolean;
}

export const DEFAULT_PROGRESS: number = 0;

export class ModelMeta extends TypeMeta<DocumentType.ProgressState> {
    readonly type = DocumentType.ProgressState;
    readonly readonly: boolean;
    readonly default: number;
    readonly preventTogglingFutureSteps: boolean;
    readonly preventTogglingPastSteps: boolean;
    readonly canStepBack: boolean;
    readonly needsConfirm: boolean;
    readonly allOpen: boolean = false;

    constructor(props: Partial<MetaInit>) {
        super(DocumentType.ProgressState, props.readonly ? Access.RO_User : undefined, props.pagePosition);
        this.default = props.default ?? DEFAULT_PROGRESS;
        this.readonly = !!props.readonly;
        if (props.allOpen) {
            this.allOpen = true;
            this.preventTogglingFutureSteps = false;
            this.preventTogglingPastSteps = false;
        } else {
            this.preventTogglingFutureSteps = !!props.preventTogglingFutureSteps;
            this.preventTogglingPastSteps = !!props.preventTogglingPastSteps;
        }
        this.canStepBack = !props.preventSteppingBack && !props.preventTogglingPastSteps;
        this.needsConfirm = !this.canStepBack || !!props.confirm;
    }

    get defaultData(): TypeDataMapping[DocumentType.ProgressState] {
        return {
            progress: this.default
        };
    }
}

class ProgressState extends iDocument<DocumentType.ProgressState> {
    @observable accessor _progress: number = 0;
    @observable accessor _viewedIndex: number | undefined = undefined;
    @observable accessor scrollTo: boolean = false;
    @observable accessor hoveredIndex: number | undefined = undefined;
    @observable accessor confirmProgressIndex: number | undefined = undefined;

    steps = observable.array<Step>();

    constructor(props: DocumentProps<DocumentType.ProgressState>, store: DocumentStore) {
        super(props, store);
        this._progress = props.data?.progress ?? 0;
    }

    get canStepBack(): boolean {
        return this.meta.canStepBack;
    }

    get needsConfirm(): boolean {
        return !this.canStepBack || this.meta.needsConfirm;
    }

    @computed
    get canToggleContent(): boolean {
        if (!this.meta) {
            return false;
        }
        if (this.meta.preventTogglingFutureSteps && this.meta.preventTogglingPastSteps) {
            return false;
        }
        return this.canInteract;
    }

    @action
    setData(data: TypeDataMapping[DocumentType.ProgressState], from: Source, updatedAt?: Date): void {
        if (!RWAccess.has(this.root?.permission)) {
            return;
        }
        const { progress } = data;
        if (progress && !this.steps[progress]?.canToggleContent && this.progress + 1 !== progress) {
            return;
        }
        if (!this.canStepBack && progress < this.progress) {
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
            return { path: mdiCheckCircleOutline, color: IfmColors.green };
        }
        const level = this.progress / this.totalSteps;
        if (this.progress === 0) {
            return { path: mdiSpeedometerSlow, color: IfmColors.gray };
        }
        if (level < 1 / 3) {
            return { path: mdiSpeedometerSlow, color: IfmColors.red };
        }
        if (level < 2 / 3) {
            return { path: mdiSpeedometerMedium, color: IfmColors.orange };
        }
        return { path: mdiSpeedometer, color: IfmColors.lightGreen };
    }

    @action
    setHoveredIndex(index?: number) {
        if (index !== undefined && !this.canStepBack && index !== this.progress) {
            return;
        }
        if (this.hoveredIndex !== index) {
            this.hoveredIndex = index;
        }
    }

    @computed
    get totalSteps(): number {
        return this.steps.length;
    }

    @action
    setTotalSteps(totalSteps: number) {
        if (this.totalSteps !== totalSteps) {
            this.steps.replace(Array.from({ length: totalSteps }, (_, i) => new Step(i, this)));
        }
    }

    @action
    setConfirmProgressIndex(index?: number) {
        this.confirmProgressIndex = index;
    }

    @computed
    get isDone(): boolean {
        return this.progress >= this.totalSteps;
    }

    @action
    onStepClicked(index: number) {
        if (!this.canStepBack) {
            if (index !== this.progress) {
                return;
            }
            if (this.confirmProgressIndex !== this.progress) {
                this.setConfirmProgressIndex(this.progress);
                return;
            }
        }
        if (index < this.progress) {
            if (this._viewedIndex === index) {
                this.setProgress(index);
            } else {
                this.setViewedIndex(index);
            }
        } else if (index === this.progress) {
            if (this.viewedIndex === index) {
                if (this.needsConfirm && this.confirmProgressIndex !== this.progress) {
                    return this.setConfirmProgressIndex(this.progress);
                }
                this.setProgress(index + 1);
            } else {
                this.setViewedIndex(index);
            }
        } else if (index === this.progress + 1) {
            if (this.needsConfirm) {
                return;
            }
            this.setProgress(index);
        }
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
        if (!this.steps[index ?? -1]?.canToggleContent) {
            return;
        }
        if (this._viewedIndex !== index) {
            this._viewedIndex = index;
        }
    }

    @computed
    get canInteract() {
        const needsAuth =
            !this.canStepBack || this.meta.preventTogglingFutureSteps || this.meta.preventTogglingPastSteps;
        return needsAuth ? !(this.root?.isDummy ?? true) : true;
    }

    @action
    setProgress(progress: number) {
        if (!this.canInteract) {
            return;
        }
        if (this._viewedIndex !== undefined) {
            this._viewedIndex = undefined;
        }

        this.confirmProgressIndex = undefined;
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
