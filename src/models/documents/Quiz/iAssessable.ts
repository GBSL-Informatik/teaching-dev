import { AssessableType, Document as DocumentProps } from '@tdev-api/document';
import iDocument, { Source } from '@tdev-models/iDocument';
import DocumentStore from '@tdev-stores/DocumentStore';
import { action, computed, observable } from 'mobx';

abstract class iAssessable<T extends AssessableType> extends iDocument<T> {
    @observable accessor _assessed: boolean;

    constructor(props: DocumentProps<T>, store: DocumentStore) {
        super(props, store);
        this._assessed = props.data?.assessed || false;
    }

    @computed
    get assessed() {
        return this._assessed;
    }

    @action
    setAssessed(value: boolean) {
        this._assessed = value;
        this.saveNow();
    }

    @computed
    get canUpdateAnswer() {
        return this.canEdit && !this._assessed;
    }

    abstract resetAnswer(questionIndex: number): void;

    shuffle(): void {
        // By default, do nothing. Only applicable for certain assessable document types (e.g. ChoiceAnswer).
    }
}

export default iAssessable;
