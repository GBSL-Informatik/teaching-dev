import { CmsStore } from '@tdev-stores/CmsStore';
import iEntry, { iEntryProps } from './iEntry';
import { action, computed } from 'mobx';
import { mdiFileCode, mdiFileDocumentOutline, mdiFileImage, mdiFilePdfBox } from '@mdi/js';
import { keysOfInterface } from '@tdev-models/helpers/keysOfInterface';
import Dir from './Dir';

export interface FileStubProps extends iEntryProps {
    size: number;
    download_url: string | null;
}
export interface RawFileProps extends FileStubProps {
    rawBase64: string;
}
export interface ContentFileProps extends FileStubProps {
    content: string;
}
export type FileProps = RawFileProps | ContentFileProps;

const FilePropKeys: ReadonlyArray<keyof FileProps> = keysOfInterface<keyof FileProps>()(
    'name',
    'path',
    'url',
    'git_url',
    'html_url',
    'sha',
    'size',
    'download_url'
);

const FileStubPropKeys: ReadonlyArray<keyof FileStubProps> = keysOfInterface<keyof FileStubProps>()(
    'name',
    'path',
    'url',
    'git_url',
    'html_url',
    'sha',
    'size',
    'download_url'
);

export abstract class iFileStub extends iEntry {
    readonly size: number;
    readonly downloadUrl: string;

    constructor(props: FileStubProps, store: CmsStore) {
        super(props, store);
        this.size = props.size;
        this.downloadUrl = props.download_url!;
    }

    get isEditing() {
        return false;
    }

    get canEdit() {
        return false;
    }

    setEditing(isEditing: boolean) {
        // no-op
    }

    @computed
    get extension() {
        return this.name.split('.').pop() || '';
    }

    @computed
    get isImage() {
        return /(jpg|jpeg|png|gif|bmp|webp|svg|avif|tiff|ico|heic|heif)$/i.test(this.extension);
    }

    @computed
    get isVideo() {
        return /(mp4|mov|avi|wmv|flv|mkv|webm|m4v|mpg|mpeg)$/i.test(this.extension);
    }

    @computed
    get isBin() {
        return /(exe|zip|rar|7z|tar|gz|bin|iso|msi|dmg|pkg|deb|rpm|xlsx?|docx?|pptx?|pdf|accdb|mdb|psd|ai|indd)$/i.test(
            this.extension
        );
    }

    @computed
    get isAsset() {
        return this.isImage || this.isVideo || this.isBin;
    }

    @computed
    get isPdf() {
        return /(pdf)$/i.test(this.extension);
    }

    @computed
    get isCode() {
        return /(js|jsx|ts|tsx|py|java|cpp|c|cs|php|rb|go|rs|swift|json|yml|yaml|html|htmx|xml|css)$/i.test(
            this.extension
        );
    }

    @computed
    get isMarkdown() {
        return /(md|mdx)$/i.test(this.extension);
    }

    @computed
    get iconColor() {
        if (this.isImage) {
            return 'var(--ifm-color-blue)';
        }
        if (this.isCode) {
            return 'var(--ifm-color-success)';
        }
        if (this.isPdf) {
            return 'var(--ifm-color-danger)';
        }
        return undefined;
    }

    @computed
    get icon() {
        if (this.isImage) {
            return mdiFileImage;
        }
        if (this.isCode) {
            return mdiFileCode;
        }
        if (this.isPdf) {
            return mdiFilePdfBox;
        }
        return mdiFileDocumentOutline;
    }

    get props(): FileStubProps {
        return {
            name: this.name,
            path: this.path,
            url: this.url,
            git_url: this.gitUrl,
            html_url: this.htmlUrl,
            sha: this.sha,
            download_url: this.downloadUrl,
            size: this.size
        };
    }

    @action
    fetchContent(editAfterFetch: boolean = false) {
        this.store.github?.fetchFile(this.branch, this.path, editAfterFetch);
    }

    static ValidateProps(props: Partial<FileStubProps> | any, type: 'stub'): FileStubProps | undefined;
    static ValidateProps(props: Partial<FileProps> | any, type: 'full'): FileProps | undefined;
    static ValidateProps(
        props: Partial<FileProps> | any,
        type: 'stub' | 'full'
    ): FileProps | FileStubProps | undefined {
        const validP = {} as FileProps;
        let isValid = true;
        const keys = type === 'stub' ? FileStubPropKeys : FilePropKeys;
        keys.forEach((k) => {
            if (props[k] === undefined) {
                isValid = false;
                console.warn('Missing key', k);
            } else {
                (validP as any)[k] = props[k];
            }
        });
        if (type === 'full') {
            if (props['content'] === undefined && props['rawBase64'] === undefined) {
                isValid = false;
                console.warn('Missing key', 'content or rawBase64');
            }
        }
        if (isValid) {
            return validP;
        }
    }
}

class FileStub extends iFileStub {
    readonly type = 'file_stub';
}

export default FileStub;
