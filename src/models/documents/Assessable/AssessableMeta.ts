import { Access, type TypeDataMapping, type AssessableType } from '@tdev-api/document';
import type { default as iAssessable, Assessement } from './iAssessable';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { observable } from 'mobx';

export interface AssessableComponentProps<T extends AssessableType> {
    id?: string;
    qid?: string;
    title?: string;
    correct?: number[];
    scoring?: ScoringFunction<T>;
    readonly?: boolean;
    children: React.ReactNode;
}

export type ScoringFunction<T extends AssessableType> = (model: iAssessable<T>) => Assessement;

export abstract class AssessableMeta<T extends AssessableType> extends TypeMeta<T> {
    readonly qid?: string;
    readonly correct?: number[];
    readonly scoring?: ScoringFunction<T>;
    @observable accessor title: string | undefined;
    constructor(type: T, props: Partial<AssessableComponentProps<T>>) {
        const explicitProps: Partial<AssessableComponentProps<T>> = {
            id: props.id,
            qid: props.qid,
            title: props.title,
            correct: props.correct,
            scoring: props.scoring,
            readonly: props.readonly
        };
        super(type, explicitProps);
        this.qid = props.qid;
        this.correct = props.correct?.map((index) => index - 1); // convert to 0-based index
        this.scoring = props.scoring;
        this.title = props.title;
    }
    abstract get defaultData(): TypeDataMapping[T];
}
