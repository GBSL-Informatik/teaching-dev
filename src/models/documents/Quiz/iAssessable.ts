import { AssessableType, Document as DocumentProps } from '@tdev-api/document';
import iDocument from '@tdev-models/iDocument';
import DocumentStore from '@tdev-stores/DocumentStore';
import { action, computed, observable } from 'mobx';
import React from 'react';
import { AssessableMeta } from './AssessableMeta';
import { mdiCheckCircleOutline, mdiCloseCircleOutline, mdiProgressCheck, mdiProgressQuestion } from '@mdi/js';

export enum Correctness {
    Correct = 'correct',
    Incorrect = 'incorrect',
    PartiallyCorrect = 'partially_correct',
    NA = 'not_answered'
}

export interface Scoring {
    maxPoints: number;
    pointsAchieved: number;
    scoringHint?: string | (() => React.ReactElement);
}

export interface Assessement {
    correctness: Correctness;
    scoring?: Scoring;
}

export interface MetaInit {
    readonly?: boolean;
}

abstract class iAssessable<T extends AssessableType> extends iDocument<T> {
    @observable accessor _assessed: boolean;
    // @observable.ref accessor scoringFunction: ((self: this) => Assessement) | null = null;
    @observable.ref accessor linkedMeta: AssessableMeta<T> | null = null;

    constructor(props: DocumentProps<T>, store: DocumentStore) {
        super(props, store);
        this._assessed = props.data?.assessed || false;
    }

    @action
    setLinkedMeta(metadata: AssessableMeta<T> | null) {
        this.linkedMeta = metadata;
        this.onLinkedMetaChange();
    }

    onLinkedMetaChange() {
        // By default, do nothing. Only applicable for certain assessable document types (e.g. ChoiceAnswer).
    }

    @computed
    get scoringFunction(): ((self: this) => Assessement) | null {
        return this.linkedMeta?.scoring || null;
    }

    @computed
    get isAssessed() {
        return this._assessed;
    }

    @computed
    get assessment(): Assessement | undefined {
        return this.scoringFunction?.(this);
    }

    @action
    setAssessed(value: boolean) {
        this._assessed = value;
        this.saveNow();
    }

    @computed
    get scoring() {
        if (!this.isAssessed) {
            return;
        }
        return this.assessment?.scoring;
    }

    @computed
    get correctness(): Correctness {
        if (!this.isAssessed) {
            return Correctness.NA;
        }
        return this.achievements === this.maxPoints && this.mistakes === 0
            ? Correctness.Correct
            : this.achievements === 0
              ? Correctness.Incorrect
              : Correctness.PartiallyCorrect;
    }

    get maxPoints(): number {
        return this.linkedMeta?.correct?.length || 0;
    }

    get achievements(): number {
        return 0;
    }

    get mistakes(): number {
        return 0;
    }

    @computed
    get correctnessIconColor() {
        if (!this.correctness) {
            return { icon: null, color: '' };
        }
        switch (this.correctness) {
            case Correctness.Correct:
                return { icon: mdiCheckCircleOutline, color: '--ifm-color-success' };
            case Correctness.PartiallyCorrect:
                return { icon: mdiProgressCheck, color: '--ifm-color-warning' };
            case Correctness.Incorrect:
                return { icon: mdiCloseCircleOutline, color: '--ifm-color-danger' };
            case Correctness.NA:
                return { icon: mdiProgressQuestion, color: '--ifm-color-info' };
        }
    }

    @computed
    get canUpdateAnswer() {
        return this.canEdit && !this.isAssessed;
    }

    abstract resetAnswer(): void;

    shuffle(): void {
        // By default, do nothing. Only applicable for certain assessable document types (e.g. ChoiceAnswer).
    }
}

export default iAssessable;
