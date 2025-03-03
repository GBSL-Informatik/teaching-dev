import { CmsStore } from '@tdev-stores/CmsStore';
import { action, computed, observable } from 'mobx';
import { ApiState } from '@tdev-stores/iStore';
import { Position } from 'unist';
import iFile, { FileProps } from './iFile';

class File extends iFile {
    readonly type = 'file';

    _pristine: string;
    @observable accessor content: string;
    // unobserved content - always in sync with content
    refContent: string;

    @observable accessor apiState: ApiState = ApiState.IDLE;
    /**
     * can be used as a key for the cms editor component.
     */
    @observable accessor resetCounter = 0;

    constructor(props: FileProps, store: CmsStore) {
        super(props, store);
        this.content = props.content;
        this._pristine = props.content;
        this.refContent = props.content;
    }

    @computed
    get componentKey() {
        return `${this.branch}-${this.path}-${this.sha}-${this.resetCounter}`;
    }

    get canEdit() {
        return true;
    }

    @computed
    get isEditing() {
        return this.store.editedFile === this;
    }

    /**
     * @returns the binary data of the file, either as a Uint8Array or a string with the original,
     * non-encoded content
     */
    get fileContent(): Uint8Array | string {
        return this.content;
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

    @computed
    get isDirty() {
        return this.content !== this._pristine;
    }

    @action
    reset() {
        if (this._pristine) {
            this.setContent(this._pristine);
            this.resetCounter++;
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
            content: this.content
        };
    }
}

export default File;
