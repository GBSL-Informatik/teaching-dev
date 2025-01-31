import { CmsStore } from '@tdev-stores/CmsStore';
import { action, computed, observable } from 'mobx';
import { FileProps, iFileStub } from './FileStub';
import { ApiState } from '@tdev-stores/iStore';
import { Position } from 'unist';

import Dir from './Dir';

class File extends iFileStub {
    readonly type = 'file';

    _pristine: string;
    @observable accessor content: string;
    // unobserved content - always in sync with content
    refContent: string;

    @observable accessor apiState: ApiState = ApiState.IDLE;

    constructor(props: FileProps, store: CmsStore) {
        super(props, store);
        if (this.isImage) {
            this.content = 'rawBase64' in props ? props.rawBase64 : props.content;
        } else {
            if ('rawBase64' in props) {
                this.content = new TextDecoder().decode(
                    Uint8Array.from(atob(props.rawBase64), (c) => c.charCodeAt(0))
                );
            } else {
                this.content = props.content;
            }
        }
        this._pristine = this.content;
        this.refContent = this.content;
    }

    get canEdit() {
        return true;
    }

    @computed
    get isEditing() {
        return this.store.editedFile === this;
    }

    @action
    setEditing(editing: boolean) {
        this.store.setIsEditing(this, editing);
    }

    @action
    setContent(content: string, isInit: boolean = false) {
        this.content = content;
        this.refContent = content;
        if (isInit) {
            this._pristine = content;
        }
    }

    @computed
    get isOnMainBranch() {
        const main = this.store.github?.defaultBranch?.name;
        if (!main) {
            return undefined;
        }
        return main === this.branch;
    }

    @action
    save(commitMessage?: string) {
        this.apiState = ApiState.SYNCING;
        this.store.github?.saveFile(this, commitMessage).catch(
            action(() => {
                this.apiState = ApiState.IDLE;
            })
        );
    }

    static ImageDataUrl(file: File) {
        if (file.extension === 'svg') {
            return `data:image/svg+xml;base64,${file.content}`;
        }
        return `data:image/${file.extension};base64,${file.content}`;
    }

    @computed
    get isDirty() {
        return this.content !== this._pristine;
    }

    @action
    reset() {
        if (this._pristine) {
            this.setContent(this._pristine);
        }
    }

    contentAt(position: Position) {
        const { start, end } = position;
        if (start.offset !== undefined && end.offset !== undefined) {
            return this.content.slice(start.offset, end.offset);
        }
        return this.content.split('\n')[start.line - 1].slice(start.column - 1, end.column);
    }

    get props(): FileProps {
        return {
            name: this.name,
            path: this.path,
            url: this.url,
            git_url: this.gitUrl,
            html_url: this.htmlUrl,
            sha: this.sha,
            download_url: this.downloadUrl,
            size: this.size,
            rawBase64: this.content
        };
    }
}

export default File;
