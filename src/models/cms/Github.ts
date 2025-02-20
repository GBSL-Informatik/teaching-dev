import { CmsStore } from '@tdev-stores/CmsStore';
import { action, computed, IObservableArray, observable } from 'mobx';
import { Octokit, RestEndpointMethodTypes as GhTypes } from '@octokit/rest';
import siteConfig from '@generated/docusaurus.config';
import FileStub, { iFileStub } from './FileStub';
import Dir from './Dir';
import { default as FileModel } from './File';
import { ApiState } from '@tdev-stores/iStore';
import Branch from './Branch';
import PR from './PR';
import { withoutPreviewPRName } from './helpers';
import blobToBase64 from '@tdev-models/helpers/blobToBase64';
const { organizationName, projectName } = siteConfig;

export type GhRepo = GhTypes['repos']['get']['response']['data'];
export type GhBranch = GhTypes['repos']['listBranches']['response']['data'][number];
export type GhPr =
    | GhTypes['pulls']['list']['response']['data'][number]
    | GhTypes['pulls']['create']['response']['data'];

const PR_PAGE_SIZE = 20;

class Github {
    readonly store: CmsStore;

    /* contains branch <-> rootDirectory */
    entries = observable.map<string, IObservableArray<Dir | FileModel | FileStub>>([], { deep: false });
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
    deleteFile(file: FileModel | FileStub) {
        file.apiState = ApiState.SYNCING;
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
                        if (current) {
                            this.entries.get(file.branch)!.remove(current);
                        }
                    }
                })
            )
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
        return this.createOrUpdateFile(
            file.path,
            file.content,
            file.branch,
            file.sha,
            commitMessage,
            file.isImage
        );
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

    @action
    createOrUpdateFile(
        path: string,
        content: string,
        branch: string,
        sha?: string,
        commitMessage?: string,
        skipBase64Transformation?: boolean
    ) {
        let base64Content = '';
        if (skipBase64Transformation) {
            base64Content = content;
        } else {
            const textContent = new TextEncoder().encode(content);
            base64Content = btoa(String.fromCharCode(...textContent));
        }
        const current = this.store.findEntry(branch, path) as FileModel | undefined;
        const branchModel = this.branches.find((b) => b.name === branch);
        return this.octokit!.repos.createOrUpdateFileContents({
            owner: organizationName!,
            repo: projectName!,
            path: path, // File path in repo
            message: commitMessage || (sha ? `Update: ${path}` : `Create ${path}`),
            content: base64Content,
            branch: branch,
            sha: sha
        }).then(
            action((res) => {
                const resContent = FileModel.ValidateProps(res.data.content, 'stub');
                if (!resContent) {
                    return;
                }
                branchModel?.sync();
                switch (res.status) {
                    case 200:
                        // file updated
                        if (current) {
                            const file = new FileModel({ ...resContent, content: content }, this.store);
                            this._addFileEntry(branch, file);
                            file.setEditing(true);
                            return file;
                        }
                        break;
                    case 201:
                        // file created
                        const file = new FileModel({ ...resContent, content: content }, this.store);
                        this._addFileEntry(branch, file);
                        return file;
                }
            })
        );
    }

    @action
    fetchDirectoryTree(file: FileStub | FileModel) {
        if (file.dir) {
            return Promise.resolve();
        }
        const path = file.path;
        const branch = file.branch;
        const parts = path.split('/').slice(0, -1);
        const promises: Promise<(FileModel | Dir | FileStub)[]>[] = [];
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
                    const entries = res.data;
                    if (Array.isArray(entries)) {
                        if (entries.length === 0) {
                            return [];
                        }
                        if (!this.entries.has(branch)) {
                            this.entries.set(
                                branch,
                                observable.array([this._createRootDir(branch)], { deep: false })
                            );
                        }
                        const newEntries: (Dir | FileStub | FileModel)[] = [];
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
                                    const fstub = new FileStub(entry, this.store);
                                    newEntries.push(fstub);
                                    arr.push(fstub);
                                    break;
                            }
                        });
                        return newEntries;
                    }
                    if (dir) {
                        dir.setIsFetched(true);
                    }
                    return [];
                })
            );
    }

    @action
    fetchFile(branch: string, path: string, editAfterFetch: boolean = false) {
        const apiId = `${branch}:${path}`;
        this.apiStates.set(apiId, ApiState.SYNCING);
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
                        this.apiStates.set(apiId, ApiState.ERROR);
                        return;
                    }
                    if ('content' in res.data) {
                        const props = FileModel.ValidateProps(res.data, 'stub');
                        if (props) {
                            this.apiStates.delete(apiId);
                            const file =
                                res.data.content === ''
                                    ? new FileStub({ ...props }, this.store)
                                    : new FileModel({ ...props, rawBase64: res.data.content }, this.store);
                            if (file.type === 'file_stub') {
                                return this.fetchRawContent(file, editAfterFetch);
                            }
                            this._addFileEntry(branch, file);
                            if (editAfterFetch) {
                                file.setEditing(true);
                            }
                            return file;
                        }
                    }
                    console.log('Error fetching file', res.data);
                    this.apiStates.set(apiId, ApiState.ERROR);
                })
            )
            .catch(
                action((err) => {
                    console.log('Error fetching file', err);
                    this.apiStates.set(apiId, ApiState.ERROR);
                })
            );
    }

    @action
    fetchRawContent(file: iFileStub, editAfterFetch: boolean = false) {
        const apiId = `${file.branch}:${file.path}`;
        this.apiStates.set(apiId, ApiState.SYNCING);
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
                const blob = new Blob([res.data as any]);
                const base64 = blobToBase64(blob, true);
                return base64;
            })
            .then(
                action((base64) => {
                    const nFile = new FileModel({ ...file.props, rawBase64: base64 }, this.store);
                    this._addFileEntry(file.branch, nFile);
                    if (editAfterFetch) {
                        file.setEditing(true);
                    }
                    return file;
                })
            )
            .catch(
                action((err) => {
                    console.log('Error fetching file', err);
                    this.apiStates.set(apiId, ApiState.ERROR);
                })
            );
    }

    /**
     * This method adds the File only to the entries map - it won't create or update the file on GitHub.
     */
    @action
    _addFileEntry(branch: string, file: FileModel | Dir) {
        if (!this.entries.has(branch)) {
            this.entries.set(branch, observable.array([this._createRootDir(branch)], { deep: false }));
        }
        const old = this.store.findEntry(branch, file.path);
        if (old) {
            this.entries.get(branch)!.remove(old);
        }
        this.entries.get(branch)!.push(file);
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
