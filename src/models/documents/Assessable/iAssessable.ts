import { AssessableType, Document as DocumentProps } from '@tdev-api/document';
import iDocument from '@tdev-models/iDocument';
import DocumentStore from '@tdev-stores/DocumentStore';
import { action, computed, observable } from 'mobx';
import React from 'react';
import { AssessableMeta } from './AssessableMeta';

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
    readonly qid?: string;
    @observable accessor _assessed: boolean;
    // @observable.ref accessor scoringFunction: ((self: this) => Assessement) | null = null;
    @observable.ref accessor linkedMeta: AssessableMeta<T> | null = null;

    constructor(props: DocumentProps<T>, store: DocumentStore) {
        super(props, store);
        this._assessed = props.data?.assessed || false;
        this.qid = props.data.qid;
    }

    @action
    setLinkedMeta(metadata: AssessableMeta<T>) {
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

    /**
     * Returns the number of correctly responded items. This can be "correct choices" for MC questions, "correct matched words" for texts or simply "1/0" for single-choice questions.
     */
    get achievements(): number {
        return 0;
    }

    /**
     * Returns the number of incorrectly responded items. This can be "incorrect choices" for MC questions, "wrong matched words" in a text or simply "0/1" for single-choice questions.
     */
    get mistakes(): number {
        return 0;
    }

    @computed
    get canUpdateAnswer() {
        return this.canEdit && !this.isAssessed;
    }

    @computed
    get inQuiz() {
        return !!this.qid;
    }

    @computed
    get displayTitle() {
        if (!this.linkedMeta) {
            return 'Frage';
        }
        if (!this.inQuiz) {
            return this.linkedMeta.title ?? 'Frage';
        }
        // TODO: check if `hideQuestionNumbers` is set in quiz and remove prefix "Frage X - " if so.
        const nr = 1;
        return this.linkedMeta.title ? `Frage ${nr} – ${this.linkedMeta.title}` : `Frage ${nr}`;
    }

    abstract resetAnswer(): void;

    shuffle(): void {
        // By default, do nothing. Only applicable for certain assessable document types (e.g. ChoiceAnswer).
    }
}

export default iAssessable;
