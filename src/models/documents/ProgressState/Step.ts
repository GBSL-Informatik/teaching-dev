import { action, computed, observable } from 'mobx';
import ProgressState from '.';
import {
    mdiCheckCircle,
    mdiCheckCircleOutline,
    mdiCircleMedium,
    mdiCircleSlice8,
    mdiProgressCheck,
    mdiRecordCircleOutline,
    mdiSpeedometer,
    mdiSpeedometerMedium,
    mdiSpeedometerSlow
} from '@mdi/js';
import { IfmColors } from '@tdev-components/shared/Colors';
import _ from 'lodash';
export interface MetaInit {
    readonly?: boolean;
    pagePosition?: number;
    default?: number;
    confirm?: boolean;
    preventSteppingBack?: boolean;
    preventTogglingFutureSteps?: boolean;
    preventTogglingPastSteps?: boolean;
}

export const DEFAULT_PROGRESS: number = 0;

interface ItemState {
    path: string;
    color: string;
    state: 'done' | 'current' | 'disabled';
}

class Step {
    readonly progressState: ProgressState;
    readonly index: number;

    @observable accessor _isOpen: boolean = false;

    constructor(index: number, model: ProgressState) {
        this.index = index;
        this.progressState = model;
    }

    @action
    setOpen(open: boolean) {
        this._isOpen = open;
    }

    @computed
    get isOpen(): boolean {
        if (this.progressState.meta.allOpen) {
            return true;
        }
        if (this.progressState.meta.keepPreviousStepsOpen && this.index < this.progressState.progress) {
            return true;
        }
        return this._isOpen;
    }

    @computed
    get state(): 'done' | 'current' | 'disabled' {
        if (this.isActive) {
            return 'current';
        }
        if (this.index < this.progressState.progress) {
            return 'done';
        }
        return 'disabled';
    }

    @computed
    get isActive(): boolean {
        return this.index === this.progressState.viewedIndex;
    }

    @computed
    get showContent(): boolean {
        return this.isActive || this.isOpen;
    }

    @computed
    get canToggleContent(): boolean {
        if (!this.progressState.canToggleContent) {
            return false;
        }
        if (this.progressState.meta.preventTogglingFutureSteps) {
            return this.index <= this.progressState.progress;
        }
        if (this.progressState.meta.preventTogglingPastSteps) {
            return this.index >= this.progressState.progress;
        }
        return true;
    }

    @computed
    get isLatest(): boolean {
        return this.index === this.progressState.progress;
    }

    @computed
    get isConfirmed(): boolean {
        return this.progressState.confirmProgressIndex === this.index;
    }

    @action
    setConfirmed(isConfirmed: boolean): void {
        this.progressState.confirmProgressIndex = isConfirmed ? this.index : undefined;
    }

    @computed
    get isHovered(): boolean {
        return this.progressState.hoveredIndex === this.index;
    }

    _setHovered = _.debounce(
        action((isHovered: boolean) => {
            this.progressState.setHoveredIndex(isHovered ? this.index : undefined);
        }),
        5
    );

    @action
    setHovered(isHovered: boolean): void {
        this._setHovered(isHovered);
    }

    @action
    onClicked() {
        this.progressState.onStepClicked(this.index);
    }

    @computed
    get isDisabled(): boolean {
        return this.index > this.progressState.progress + 1;
    }

    @computed
    get isNextHovered(): boolean {
        return this.progressState.hoveredIndex === this.index + 1;
    }

    @computed
    get isFinalStep(): boolean {
        return this.index === this.progressState.totalSteps - 1;
    }

    @computed
    get iconState(): ItemState {
        if (this.index === this.progressState.progress) {
            if (this.progressState.needsConfirm) {
                if (this.isConfirmed) {
                    if (this.isHovered) {
                        return { path: mdiCheckCircle, color: IfmColors.green, state: 'current' };
                    }
                    return { path: mdiProgressCheck, color: IfmColors.blue, state: 'current' };
                }
                if (this.isHovered && this.isActive) {
                    return { path: mdiProgressCheck, color: IfmColors.blue, state: 'current' };
                }
                return {
                    path: mdiRecordCircleOutline,
                    color: IfmColors.primary,
                    state: 'current'
                };
            }
            if (this.isHovered && this.isActive) {
                return { path: mdiCheckCircle, color: IfmColors.green, state: 'current' };
            }
            if (this.isNextHovered) {
                return { path: mdiCheckCircle, color: IfmColors.green, state: 'current' };
            }
            if (this.isActive || this.isHovered) {
                return {
                    path: mdiRecordCircleOutline,
                    color: IfmColors.primary,
                    state: 'current'
                };
            }
            return { path: mdiCircleMedium, color: IfmColors.primary, state: 'current' };
        }
        if (this.index === this.progressState._viewedIndex) {
            if (this.isHovered) {
                return { path: mdiCircleSlice8, color: IfmColors.primaryDarker, state: 'done' };
            }
            return { path: mdiRecordCircleOutline, color: IfmColors.primary, state: 'done' };
        }
        if (this.isFinalStep && this.progressState.isDone) {
            return { path: mdiCheckCircle, color: IfmColors.green, state: 'done' };
        }
        if (this.index < this.progressState.progress) {
            return { path: mdiCircleMedium, color: IfmColors.green, state: 'done' };
        }
        if (
            this.isHovered &&
            this.progressState.hoveredIndex === this.progressState.progress + 1 &&
            !this.progressState.needsConfirm
        ) {
            return { path: mdiRecordCircleOutline, color: IfmColors.primary, state: 'disabled' };
        }
        return { path: mdiCircleMedium, color: 'var(--tdev-progress-rail-color)', state: 'disabled' };
    }
}

export default Step;
