import type { CodeCommitData, Document as DocumentProps } from '@tdev-api/document';
import iDocument from '@tdev-models/iDocument';
import DocumentStore from '@tdev-stores/DocumentStore';
import { computed } from 'mobx';

class CodeCommit extends iDocument<'code_commit'> {
    constructor(props: DocumentProps<'code_commit'>, store: DocumentStore) {
        super(props, store);
    }

    setData(data: CodeCommitData): void {
        throw new Error('CodeCommits can not be updated.');
    }

    get data() {
        return this._pristine;
    }

    get code() {
        return this.data.code;
    }

    get message() {
        return this.data.message;
    }

    @computed
    get title() {
        return this.message.split('\n')[0];
    }

    @computed
    get details() {
        return this.message.split('\n').slice(1).join('\n').trim();
    }
}

export default CodeCommit;
