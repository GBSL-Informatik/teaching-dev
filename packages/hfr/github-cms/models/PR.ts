import { action, computed, observable } from 'mobx';
import Github from './Github';
import { ApiState } from '@tdev-stores/iStore';
import { withoutPreviewPRName, withPreviewPRName } from './helpers';

type PRRef = {
    label: string;
    ref: string;
    sha: string;
    repo: {
        name: string;
        owner: {
            login: string;
        };
    };
};

interface Props {
    number: number;
    state: string;
    updated_at: string;
    merged_at: string | null;
    draft?: boolean;
    created_at: string;
    body: string | null;
    title: string;
    head: PRRef;
    base: PRRef;
    html_url: string;
    labels: {
        name: string;
    }[];
}

class PR {
    readonly gitProvider: Github;
    readonly number: number;

    readonly updatedAt: Date;
    readonly createdAt: Date;
    readonly mergedAt: Date | null;
    // readonly head: PRRef;
    readonly htmlUrl: string;
    readonly branchName: string;
    readonly owner: string; // e.g github username

    labels = observable.set<string>();

    @observable accessor title: string;
    @observable accessor body: string;

    @observable accessor state: string;
    @observable accessor headSha: string;
    @observable accessor merged: boolean | undefined;
    @observable accessor mergeable: boolean | undefined;
    @observable accessor rebaseable: boolean | undefined;
    @observable accessor mergeableState: string | undefined;

    @observable accessor apiState: ApiState = ApiState.IDLE;
    @observable accessor isSynced: boolean = false;
    @observable accessor isDraft: boolean = false;

    constructor(props: Props, github: Github) {
        this.gitProvider = github;
        this.number = props.number;
        // this.head = props.head;
        this.headSha = props.head.sha;
        this.branchName = props.head.ref;
        this.owner = props.head.repo.owner.login;
        this.labels.replace(props.labels.map((l) => l.name));

        this.body = props.body || '';
        this.title = props.title;
        this.state = props.state;
        this.htmlUrl = props.html_url;
        this.isDraft = !!props.draft;
        this.updatedAt = new Date(props.updated_at);
        this.createdAt = new Date(props.created_at);
        this.mergedAt = props.merged_at ? new Date(props.merged_at) : null;
    }

    @computed
    get hasPreview() {
        return this.title === withPreviewPRName(this.title);
    }

    @action
    setPreview(enabled: boolean) {
        if (enabled) {
            return this.gitProvider.updatePr(this.number, { title: withPreviewPRName(this.title) });
        } else {
            return this.gitProvider.updatePr(this.number, { title: withoutPreviewPRName(this.title) });
        }
    }

    @computed
    get branch() {
        return this.gitProvider.store.findBranch(this.branchName);
    }

    @action
    setApiState(state: ApiState) {
        this.apiState = state;
    }

    @action
    setMerged(merged: boolean) {
        this.merged = merged;
    }

    @computed
    get hasBlockingLabel() {
        return this.labels.has('blocked');
    }

    @action
    update(data: Partial<Props>) {
        if (data.state) {
            this.state = data.state;
        }
        if (data.title) {
            this.title = data.title;
        }
        if (data.body) {
            this.body = data.body;
        }
    }

    @action
    sync(syncBranch = true) {
        this.setApiState(ApiState.SYNCING);
        const promises = [
            this.gitProvider
                .fetchPrState(this.number)
                .then(
                    action((res) => {
                        if (!res) {
                            return;
                        }
                        this.title = res.title;
                        this.body = res.body || '';
                        this.mergeable = !!res.mergeable;
                        this.rebaseable = !!res.rebaseable;
                        this.mergeableState = res.mergeable_state;
                        this.setMerged(res.merged);
                        this.headSha = res.head.sha;
                        this.labels.replace(res.labels.map((l) => l.name));
                        this.isDraft = !!res.draft;
                        this.isSynced = true;
                        this.state = res.state;
                    })
                )
                .catch((err) => {
                    console.log('error fetching pr state', err);
                })
        ];
        if (syncBranch && this.branch) {
            promises.push(this.branch.sync());
        }
        Promise.all(promises).finally(() => {
            this.setApiState(ApiState.IDLE);
        });
    }

    @computed
    get canMerge() {
        return this.mergeable && !this.hasBlockingLabel && !this.isDraft && !this.isClosed;
    }

    @computed
    get isClosed() {
        return this.state === 'closed';
    }
}

export default PR;
