import { Access, AssessableType, Document as DocumentProps, TypeDataMapping } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import iDocument, { Source } from '@tdev-models/iDocument';
import DocumentStore from '@tdev-stores/DocumentStore';
import { action, computed, observable } from 'mobx';
import React from 'react';

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
    @observable.ref accessor scoringFunction: ((self: this) => Assessement) | null = null;

    constructor(props: DocumentProps<T>, store: DocumentStore) {
        super(props, store);
        this._assessed = props.data?.assessed || false;
    }

    @action
    setScoringFunction(scoringFn: ((self: this) => Assessement) | null) {
        this.scoringFunction = scoringFn;
    }

    @computed
    get isAssessed() {
        return this._assessed;
    }

    @computed
    get assessment(): Assessement | null {
        if (!this.isAssessed || !this.scoringFunction) {
            return null;
        }
        // TODO: should the scoring function receive the props/data of the document?
        return this.scoringFunction(this);
    }

    @action
    setAssessed(value: boolean) {
        this._assessed = value;
        this.saveNow();
    }

    @computed
    get canUpdateAnswer() {
        return this.canEdit && !this.isAssessed;
    }

    abstract resetAnswer(): void;

    shuffle(optionsCount: number): void {
        // By default, do nothing. Only applicable for certain assessable document types (e.g. ChoiceAnswer).
    }
}

export default iAssessable;
