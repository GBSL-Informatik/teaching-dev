import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { DocumentType, Document as DocumentProps, TypeDataMapping, Access } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { RWAccess } from '@tdev-models/helpers/accessPolicy';
import { mdiCheckCircleOutline, mdiSpeedometer, mdiSpeedometerMedium, mdiSpeedometerSlow } from '@mdi/js';
import { IfmColors } from '@tdev-components/shared/Colors';
import Step from './Step';
import type { iTaskableDocument } from '@tdev-models/iTaskableDocument';

export interface MetaInit {
    readonly?: boolean;
    pagePosition?: number;
    default?: number;
    confirm?: boolean;
    allOpen?: boolean;
    keepPreviousStepsOpen?: boolean;
    preventSteppingBack?: boolean;
    preventTogglingFutureSteps?: boolean;
    preventTogglingPastSteps?: boolean;
}

export const DEFAULT_PROGRESS: number = 0;

export class ModelMeta extends TypeMeta<'progress_state'> {
    readonly type = 'progress_state';
    readonly readonly: boolean;
    readonly default: number;
    readonly preventTogglingFutureSteps: boolean;
    readonly preventTogglingPastSteps: boolean;
    readonly canStepBack: boolean;
    readonly needsConfirm: boolean;
    readonly allOpen: boolean = false;
    readonly keepPreviousStepsOpen: boolean;

    constructor(props: Partial<MetaInit>) {
        super('progress_state', props.readonly ? Access.RO_User : undefined, props.pagePosition);
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
        this.keepPreviousStepsOpen = !this.preventTogglingPastSteps && !!props.keepPreviousStepsOpen;
        this.canStepBack = !props.preventSteppingBack && !props.preventTogglingPastSteps;
        this.needsConfirm = !this.canStepBack || !!props.confirm;
    }

    get defaultData(): TypeDataMapping['progress_state'] {
        return {
            progress: this.default,
            totalSteps: Math.max(this.default, 1)
        };
    }
}

class ProgressState extends iDocument<'progress_state'> implements iTaskableDocument<'progress_state'> {
    @observable accessor _progress: number = 0;
    @observable accessor _totalSteps: number = 0;
    @observable accessor _viewedIndex: number | undefined = undefined;
    @observable accessor scrollTo: boolean = false;
    @observable accessor hoveredIndex: number | undefined = undefined;
    @observable accessor confirmProgressIndex: number | undefined = undefined;

    steps = observable.array<Step>();

    constructor(props: DocumentProps<'progress_state'>, store: DocumentStore) {
        super(props, store);
        this._progress = props.data?.progress ?? 0;
        this.setTotalSteps(Math.max(props.data?.totalSteps ?? 1, props.data?.progress ?? 0, 1), true);
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
    setData(data: Partial<TypeDataMapping['progress_state']>, from: Source, updatedAt?: Date): void {
        if (!RWAccess.has(this.root?.permission)) {
            return;
        }
        const { progress, totalSteps } = data;
        if (progress && !this.steps[progress]?.canToggleContent && this.progress + 1 !== progress) {
            return;
        }
        if (progress !== undefined && (this.canStepBack || progress > this.progress)) {
            this._progress = progress;
        }
        if (totalSteps !== undefined) {
            this.setTotalSteps(totalSteps, true);
        }

        if (from === Source.LOCAL) {
            this.saveNow();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping['progress_state'] {
        return {
            progress: this._progress,
            totalSteps: this._totalSteps
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
        return Math.max(this._totalSteps, 1, this.progress);
    }

    @action
    setTotalSteps(totalSteps: number, skipSave: boolean = false) {
        const skip = this._totalSteps !== 0 && this.totalSteps === totalSteps;
        if (totalSteps < 1 || skip) {
            return;
        }
        this._totalSteps = totalSteps;
        this.steps.replace(Array.from({ length: totalSteps }, (_, i) => new Step(i, this)));
        if (!skipSave) {
            this.saveNow();
        }
    }

    @action
    setConfirmProgressIndex(index?: number) {
        this.confirmProgressIndex = index;
    }

    @computed
    get isDone(): boolean {
        if (!this.totalSteps) {
            return false;
        }
        return this.progress > 0 && this.progress >= this.totalSteps;
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
        return this._progress ?? this.meta.default;
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === 'progress_state') {
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
