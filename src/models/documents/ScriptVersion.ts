import iDocument from '@tdev-models/iDocument';
import { DocumentType, Document as DocumentProps, ScriptVersionData } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { computed } from 'mobx';
import Script from './Script';

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

    @computed
    get version() {
        const script = this.root?.firstMainDocument as Script;
        if (!script) {
            return 0;
        }
        return script.versions.indexOf(this) + 1;
    }

    get pasted() {
        return this.data.pasted;
    }
}

export default ScriptVersion;
