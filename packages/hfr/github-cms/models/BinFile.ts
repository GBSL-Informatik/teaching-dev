import { CmsStore } from '../stores/CmsStore';
import { observable } from 'mobx';
import { ApiState } from '@tdev-stores/iStore';
import iFile, { BinFileProps } from './iFile';

class BinFile extends iFile {
    readonly type = 'bin_file';
    binData: Uint8Array<ArrayBuffer>;
    src: string;

    @observable accessor apiState: ApiState = ApiState.IDLE;

    constructor(props: BinFileProps, store: CmsStore) {
        super(props, store);
        this.binData = props.binData;
        const blob = new Blob([props.binData], { type: `${this.mimeType}/${this.mimeExtension}` });
        this.src = URL.createObjectURL(blob);
    }

    get canEdit() {
        return false;
    }

    /**
     * @returns the binary data of the file, either as a Uint8Array or a string with the original,
     * non-encoded content
     */
    get fileContent(): Uint8Array<ArrayBuffer> | string {
        return this.binData;
    }

    get props(): BinFileProps {
        return {
            name: this.name,
            path: this.path,
            url: this.url,
            git_url: this.gitUrl,
            html_url: this.htmlUrl,
            sha: this.sha,
            download_url: this.downloadUrl,
            size: this.size,
            binData: this.binData
        };
    }
}

export default BinFile;
