import iDocument from '@tdev-models/iDocument';
import { DocumentType, Document as DocumentProps, ScriptVersionData } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';

class ScriptVersion extends iDocument<'script_version'> {
    constructor(props: DocumentProps<'script_version'>, store: DocumentStore) {
        super(props, store);
    }

    setData(data: ScriptVersionData): void {
        throw new Error('ScriptVersions can not be updated.');
    }

    get data() {
        return this._pristine;
    }

    get code() {
        return this.data.code;
    }

    get version() {
        return this.data.version;
    }

    get pasted() {
        return this.data.pasted;
    }
}

export default ScriptVersion;
