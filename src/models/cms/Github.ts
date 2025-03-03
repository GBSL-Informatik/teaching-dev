import { CmsStore } from '@tdev-stores/CmsStore';
import { action, computed, IObservableArray, observable } from 'mobx';
import { Octokit, RestEndpointMethodTypes as GhTypes } from '@octokit/rest';
import siteConfig from '@generated/docusaurus.config';
import { FileStubProps, iFile } from './iFile';
import FileStub from './FileStub';
import Dir from './Dir';
import { default as FileModel } from './File';
import { ApiState } from '@tdev-stores/iStore';
import Branch from './Branch';
import PR from './PR';
import { convertToBase64, isBinaryFile, withoutPreviewPRName } from './helpers';
import BinFile from './BinFile';
const { organizationName, projectName } = siteConfig;

export type GhRepo = GhTypes['repos']['get']['response']['data'];
export type GhBranch = GhTypes['repos']['listBranches']['response']['data'][number];
export type GhPr =
    | GhTypes['pulls']['list']['response']['data'][number]
    | GhTypes['pulls']['create']['response']['data'];

const PR_PAGE_SIZE = 20;
type FileEntry = FileStub | BinFile | FileModel | Dir;

class Github {
    readonly store: CmsStore;

    /* contains branch <-> rootDirectory */
    entries = observable.map<string, IObservableArray<Dir | FileModel | BinFile | FileStub>>([], {
        deep: false
    });
    @observable.ref accessor octokit: Octokit;

    branches = observable.array<Branch>([]);

    PRs = observable.array<PR>([]);

    @observable.ref accessor repo: GhRepo | undefined;

    apiStates = observable.map<string, ApiState>([], { deep: false });

    constructor(accessToken: string, store: CmsStore) {
        this.store = store;
        this.octokit = new Octokit({ auth: accessToken });
    }

    @action
    load() {
        return Promise.all([this.fetchRepo(), this.fetchBranches(), this.fetchPRs()]).catch((err) => {
            if (/Bad credentials/.test(err.message)) {
                this.store.clearAccessToken();
            }
        });
    }

    @action
    fetchRepo() {
        return this.octokit.repos.get({ repo: projectName!, owner: organizationName!, _: Date.now() }).then(
            action((res) => {
                this.repo = res.data;
            })
        );
    }

    @computed
    get defaultBranchName() {
        if (!this.repo) {
            return undefined;
        }
        return this.repo.default_branch;
    }

    @computed
    get defaultBranch() {
        if (!this.repo) {
            return undefined;
        }
        return this.branches.find((ref) => ref.name === this.defaultBranchName);
    }

    @action
    fetchBranches() {
        return this.octokit.repos
            .listBranches({ repo: projectName!, owner: organizationName!, _: Date.now() })
            .then(
                action((res) => {
                    const branches = res.data.map((br) => new Branch(br, this));
                    this.branches.replace(branches);
                })
            );
    }

    @action
    clearEntries(branch: string) {
        this.entries.set(branch, observable.array([], { deep: false }));
    }

    @action
    fetchPRs(page?: number) {
        return this.octokit.pulls
            .list({
                repo: projectName!,
                owner: organizationName!,
                state: 'open',
                per_page: PR_PAGE_SIZE,
                sort: 'created',
                direction: 'desc',
                page: page ?? 1,
                _: Date.now() // disable cache
            })
            .then(
                action((res) => {
                    const prs = res.data.map((pr) => new PR(pr, this));
                    const newPRs = new Set(prs.map((pr) => pr.number));
                    this.PRs.replace([...this.PRs.filter((pr) => !newPRs.has(pr.number)), ...prs]);
                })
            );
    }

    @action
    fetchPrState(number: number) {
        return this.octokit.pulls
            .get({
                repo: projectName!,
                owner: organizationName!,
                pull_number: number,
                _: Date.now() // disable cache
            })
            .then(
                action((res) => {
                    return res.data;
                })
            );
    }

    @computed
    get nextBranchName() {
        const now = new Date().toISOString().replace('T', '--').replaceAll(':', '-').slice(0, 17);
        return `cms/update-${now}`;
    }

    @action
    saveFileInNewBranchAndCreatePr(file: FileModel, newBranch: string) {
        this.createNewBranch(newBranch)
            .then(async () => {
                await this.createOrUpdateFile(file.path, file.content, newBranch, file.sha);
                await this.createPR(newBranch, withoutPreviewPRName(newBranch));
                this.store.settings?.setLocation(newBranch, file.path);
            })
            .catch(() => {
                return this.deleteBranch(newBranch).catch(() => {
                    console.warn('Failed to delete branch', newBranch);
                });
            });
    }

    @action
    deleteFile(file: FileModel | FileStub | BinFile) {
        if (file.isDummy) {
            this._rmFileEntry(file);
            return Promise.resolve();
        }
        return file
            .withApiState(() => {
                return this.octokit.repos
                    .deleteFile({
                        owner: organizationName!,
                        repo: projectName!,
                        message: `Delete ${file.path}`,
                        path: file.path,
                        sha: file.sha,
                        branch: file.branch
                    })
                    .then(
                        action((res) => {
                            if (res.status === 200) {
                                const current = this.store.findEntry(file.branch, file.path);
                                this._rmFileEntry(current);
                            }
                        })
                    );
            })
            .catch((err) => {
                console.error('Error deleting file', err);
                this.store.findEntry(file.branch, file.path)?.setApiState(ApiState.ERROR);
            });
    }

    @action
    rebaseBranch(branch: string, to: string) {
        // octokit has no "rebase" action, so do a merge
        return this.octokit.repos
            .merge({
                owner: organizationName!,
                repo: projectName!,
                base: to,
                head: branch,
                commit_message: `Merge ${branch} into ${to}`
            })
            .then(
                action((res) => {
                    const newBranch = new Branch({ name: branch, commit: res.data }, this);
                    this._addBranchEntry(newBranch);
                    newBranch.sync();
                    if (newBranch.PR) {
                        newBranch.PR.sync();
                    }
                    return res.data;
                })
            )
            .catch((err) => {
                console.error('Error merging branch', err);
                return err;
            });
    }

    @action
    mergePR(prNumber: number) {
        this.octokit.pulls
            .merge({
                owner: organizationName!,
                repo: projectName!,
                pull_number: prNumber,
                merge_method: 'merge', // or "squash" or "rebase"
                commit_title: `CMS: Merge #${prNumber}`
            })
            .then(
                action((res) => {
                    const pr = this.store.findPr(prNumber);
                    if (pr) {
                        pr.setMerged(true);
                        pr.sync();
                    }
                })
            );
    }

    @action
    closeAndDeletePr(prNumber: number) {
        const pr = this.PRs.find((p) => p.number === prNumber);
        if (!pr) {
            return;
        }
        this.closePr(prNumber).then(() => {
            this.deleteBranch(pr.branchName).catch(() => {
                console.warn('Failed to delete branch', pr.branchName);
            });
        });
    }

    @action
    deleteBranch(name: string) {
        return this.octokit.git
            .deleteRef({
                owner: organizationName!,
                repo: projectName!,
                ref: `heads/${name}`
            })
            .then(
                action(() => {
                    const current = this.branches.find((b) => b.name === name);
                    if (current) {
                        this.branches.remove(current);
                    }
                    if (this.defaultBranchName) {
                        this.store.setBranch(this.defaultBranchName);
                    }
                })
            );
    }

    @action
    closePr(prNumber: number) {
        return this.octokit.pulls
            .update({
                owner: organizationName!,
                repo: projectName!,
                pull_number: prNumber,
                state: 'closed'
            })
            .then(
                action(() => {
                    const current = this.PRs.find((b) => b.number === prNumber);
                    if (current) {
                        this.PRs.remove(current);
                    }
                })
            );
    }

    @action
    updatePr(prNumber: number, data: Partial<{ title: string; body: string; state: 'open' | 'closed' }>) {
        const patch = { ...data };
        (Object.keys(patch) as ('title' | 'body' | 'state')[]).forEach((key) => {
            if (data[key] === undefined) {
                delete data[key];
            }
        });
        if (Object.keys(patch).length === 0) {
            return Promise.resolve();
        }
        return this.octokit.pulls
            .update({
                owner: organizationName!,
                repo: projectName!,
                pull_number: prNumber,
                ...patch
            })
            .then((res) => {
                const pr = this.store.findPr(prNumber);
                if (pr && res.data) {
                    pr.update(res.data);
                }
            })
            .catch((err) => {
                console.warn('Error updating PR', patch, err);
            });
    }

    @action
    createNewBranch(name: string) {
        if (!this.defaultBranch) {
            return Promise.resolve();
        }

        return this.octokit.git
            .createRef({
                owner: organizationName!,
                repo: projectName!,
                ref: `refs/heads/${name}`,
                sha: this.defaultBranch.sha
            })
            .then(
                action((res) => {
                    const newBranch = new Branch(
                        {
                            name: name,
                            commit: {
                                sha: res.data.object.sha,
                                url: res.data.object.url
                            }
                        },
                        this
                    );
                    this._addBranchEntry(newBranch);
                    return newBranch;
                })
            );
    }

    @action
    createPR(branch: string, title: string, body?: string) {
        if (!this.defaultBranchName) {
            return Promise.resolve();
        }
        return this.octokit.pulls
            .create({
                owner: organizationName!,
                repo: projectName!,
                title: title,
                head: branch,
                base: this.defaultBranchName, // or whatever base branch
                body: body
            })
            .then((res) => {
                const pr = new PR(res.data, this);
                this._addPr(pr);
                return pr;
            });
    }

    @action
    saveFile(file: FileModel, commitMessage?: string) {
        return this.createOrUpdateFile(file.path, file.content, file.branch, file.sha, commitMessage);
    }

    @action
    fetchBranchStatus(from: Branch, to?: Branch) {
        const toBranch = to?.sha || this.defaultBranch?.name;
        if (!toBranch) {
            return Promise.resolve();
        }
        return this.octokit.repos
            .compareCommitsWithBasehead({
                basehead: `${toBranch}...${from.name}`,
                owner: organizationName!,
                repo: projectName!,
                _: Date.now() // disable cache
            })
            .then((res) => res.data);
    }

    static NewFileModel(data: FileStubProps, content: string | Uint8Array | undefined, store: CmsStore) {
        if (content === undefined || (content === '' && data.encoding === 'none')) {
            return new FileStub(data, store);
        }
        if (isBinaryFile(data.path)) {
            const bin =
                typeof content === 'string'
                    ? Uint8Array.from(atob(content), (c) => c.charCodeAt(0))
                    : content;
            return new BinFile({ ...data, binData: bin }, store);
        }
        const strData =
            typeof content === 'string'
                ? new TextDecoder().decode(Uint8Array.from(atob(content), (c) => c.charCodeAt(0)))
                : new TextDecoder().decode(content);
        return new FileModel({ ...data, content: strData }, store);
    }

    @action
    createOrUpdateFile(
        path: string,
        content: string | Uint8Array,
        branch: string,
        sha?: string,
        commitMessage?: string
    ) {
        const binContent = typeof content === 'string' ? new TextEncoder().encode(content) : content;
        const current = this.store.findEntry(branch, path) as FileModel | undefined;
        const branchModel = this.branches.find((b) => b.name === branch);
        return convertToBase64(binContent)
            .then((base64Content) => {
                // const base64Content = btoa(String.fromCharCode(...binContent));
                return this.octokit!.repos.createOrUpdateFileContents({
                    owner: organizationName!,
                    repo: projectName!,
                    path: path, // File path in repo
                    message: commitMessage || (sha ? `Update: ${path}` : `Create ${path}`),
                    content: base64Content,
                    branch: branch,
                    sha: sha
                });
            })
            .then(
                action((res) => {
                    const resContent = FileStub.ValidateProps(res.data.content);
                    if (!resContent) {
                        return;
                    }
                    branchModel?.sync();
                    switch (res.status) {
                        case 200:
                            // file updated
                            if (current) {
                                const file = Github.NewFileModel(resContent, binContent, this.store);
                                this._addFileEntry(branch, file);
                                file.setEditing(true);
                                return file;
                            }
                            break;
                        case 201:
                            // file created
                            const file = Github.NewFileModel(resContent, binContent, this.store);
                            this._addFileEntry(branch, file);
                            return file;
                    }
                })
            );
    }

    @action
    fetchDirectoryTree(file: FileStub | FileModel | BinFile | Dir, openTree?: boolean) {
        if (file.dir) {
            return Promise.resolve();
        }
        const path = file.path;
        const branch = file.branch;
        const parts = path.split('/').slice(0, -1);
        const promises: Promise<FileEntry[]>[] = [];
        for (let i = 1; i <= parts.length; i++) {
            const dirPath = parts.slice(0, i).join('/');
            const dir = this.store.findEntry(branch, dirPath) as Dir | undefined;
            if (!dir || !dir.isFetched) {
                const res = this.fetchDirectory(branch, dirPath);
                promises.push(res);
            }
        }
        return Promise.all(promises).then(
            action(() => {
                if (file.dir) {
                    let curr: Dir | undefined = file.dir;
                    while (curr) {
                        curr.setIsFetched(true);
                        if (openTree) {
                            curr.setOpen(true);
                        }
                        curr = curr.dir;
                    }
                }
            })
        );
    }

    _createRootDir(branch: string) {
        const rootDir = new Dir(
            {
                path: '/',
                git_url: null,
                html_url: `https://github.com/${organizationName!}/${projectName!}/tree/${branch}`,
                name: '/',
                sha: this.store.findBranch(branch)?.sha || '',
                url: `https://api.github.com/repos/${organizationName!}/${projectName!}/contents?ref=${branch}`
            },
            this.store
        );
        rootDir.setIsFetched(true);
        return rootDir;
    }

    @action
    fetchDirectory(branch: string, path: string = '', force: boolean = false) {
        return this.octokit.repos
            .getContent({
                owner: organizationName!,
                repo: projectName!,
                path: path,
                ref: branch,
                _: Date.now() // disable cache
            })
            .then(
                action((res) => {
                    const dir = this.store.findEntry(branch, path) as Dir | undefined;
                    this._handleDirectoryResponse(res.data, branch, true, force);
                    if (dir) {
                        dir.setIsFetched(true);
                    }
                    return [];
                })
            );
    }

    @action
    fetchFile(
        file: iFile,
        editAfterFetch: boolean = false
    ): Promise<FileModel | BinFile | FileEntry[] | undefined> {
        const { branch, path } = file;
        if (path === '/') {
            if (file.type === 'file_stub') {
                this._rmFileEntry(file as FileStub);
            }
            return Promise.resolve(undefined);
        }
        if (file.isSyncing) {
            console.log('Already fetching', file.path, file.branch);
            return Promise.resolve(undefined);
        }
        return file
            .withApiState(() => {
                return this.octokit.repos
                    .getContent({
                        owner: organizationName!,
                        repo: projectName!,
                        path: path,
                        ref: branch,
                        _: Date.now() // disable cache
                    })
                    .then(
                        action((res) => {
                            const { data } = res || {};
                            if (!data || !('type' in data) || data.type !== 'file') {
                                // we loaded a directory...
                                if (Array.isArray(data) && file.isDummy) {
                                    this._rmFileEntry(file as FileStub);
                                    return this._handleDirectoryResponse(data, branch, true, false);
                                }
                                return undefined;
                            }
                            if ('content' in res.data) {
                                const props = FileStub.ValidateProps(res.data);
                                if (props) {
                                    const file = Github.NewFileModel(res.data, res.data.content, this.store);
                                    if (file.type === 'file_stub') {
                                        return this.fetchRawContent(file, editAfterFetch, true);
                                    }
                                    this._addFileEntry(branch, file);
                                    if (editAfterFetch) {
                                        file.setEditing(true);
                                    }
                                    return file;
                                }
                            }
                            throw new Error('Invalid file data: missing "content" property');
                        })
                    );
            })
            .catch(
                action((err) => {
                    console.log('Error fetching file', err);
                    return undefined;
                })
            );
    }

    @action
    fetchRawContent(
        file: iFile,
        editAfterFetch: boolean = false,
        skipSyncCheck: boolean = false
    ): Promise<FileModel | BinFile | undefined> {
        if (!skipSyncCheck && file.isSyncing) {
            console.log('Already fetching', file.path, file.branch);
            return Promise.resolve(undefined);
        }
        return file
            .withApiState(() => {
                return this.octokit.git
                    .getBlob({
                        owner: organizationName!,
                        repo: projectName!,
                        path: file.path,
                        ref: file.branch,
                        file_sha: file.sha,
                        mediaType: { format: 'raw' },
                        _: Date.now() // disable cache
                    })
                    .then((res) => {
                        return res.data as any as Uint8Array;
                    })
                    .then(
                        action((binData) => {
                            const nFile = Github.NewFileModel(file.props, binData, this.store) as
                                | FileModel
                                | BinFile;
                            this._addFileEntry(file.branch, nFile);
                            if (editAfterFetch && nFile.type === 'file') {
                                nFile.setEditing(true);
                            }
                            return nFile;
                        })
                    );
            })
            .catch(
                action((err) => {
                    console.log('Error fetching file', err);
                    return undefined;
                })
            );
    }

    @action
    _handleDirectoryResponse(
        entries: GhTypes['repos']['getContent']['response']['data'],
        branch: string,
        loadRecursive: boolean,
        force: boolean
    ) {
        if (!Array.isArray(entries) || entries.length === 0) {
            return [];
        }
        if (!this.entries.has(branch)) {
            this.entries.set(branch, observable.array([this._createRootDir(branch)], { deep: false }));
        }
        const newEntries: FileEntry[] = [];
        const arr = this.entries.get(branch)!;
        entries.forEach((entry) => {
            const old = arr.find((e) => e.path === entry.path);
            if (old) {
                if (!force && old.sha === entry.sha) {
                    newEntries.push(old);
                    return;
                }
                arr.remove(old);
            }
            switch (entry.type) {
                case 'dir':
                    const dir = new Dir(entry, this.store);
                    newEntries.push(dir);
                    arr.push(dir);
                    break;
                case 'file':
                    const fstub = Github.NewFileModel(entry, undefined, this.store);
                    newEntries.push(fstub);
                    arr.push(fstub);
                    break;
            }
        });
        if (loadRecursive && newEntries.length > 0) {
            this.fetchDirectoryTree(newEntries[0], true);
        }
        return newEntries;
    }

    /**
     * This method adds the File only to the entries map - it won't create or update the file on GitHub.
     */
    @action
    _addFileEntry(branch: string, file: FileModel | FileStub | BinFile | Dir) {
        if (!this.entries.has(branch)) {
            this.entries.set(branch, observable.array([this._createRootDir(branch)], { deep: false }));
        }
        const old = this.store.findEntry(branch, file.path);
        if (old) {
            if (file.type === old.type && old.sha === file.sha) {
                return;
            }
            this.entries.get(branch)!.remove(old);
        }
        this.entries.get(branch)!.push(file);
    }

    /**
     * This method removes the File only from the entries map - it won't delete or update the file on GitHub.
     */
    @action
    _rmFileEntry(file: FileModel | FileStub | BinFile | Dir | undefined) {
        if (!file || !this.entries.has(file.branch)) {
            return;
        }
        this.entries.get(file.branch)!.remove(file);
    }

    @action
    _addBranchEntry(branch: Branch) {
        const current = this.branches.find((b) => b.name === branch.name);
        if (current) {
            this.branches.remove(current);
        }
        this.branches.push(branch);
    }

    @action
    _addPr(pr: PR) {
        const current = this.PRs.find((b) => b.number === pr.number);
        if (current) {
            this.PRs.remove(current);
        }
        this.PRs.push(pr);
    }
}

export default Github;
