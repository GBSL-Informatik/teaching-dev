import { action, computed, observable } from 'mobx';
import Github from './Github';
import { ApiState } from '@tdev-stores/iStore';

interface Props {
    name: string;
    commit: {
        sha: string;
        url: string;
    };
}

export enum MergeStatus {
    Unchecked = 'unchecked',
    Ready = 'ready',
    Conflict = 'conflict'
}

class Branch {
    readonly gitProvider: Github;
    readonly name: string;
    readonly url: string;
    @observable accessor sha: string;
    @observable accessor apiState: ApiState = ApiState.IDLE;
    @observable accessor isSynced: boolean = false;
    @observable accessor aheadBy: number = -1;
    @observable accessor behindBy: number = -1;

    constructor(props: Props, github: Github) {
        this.gitProvider = github;
        this.name = props.name;
        this.sha = props.commit.sha;
        this.url = props.commit.url;
    }

    @action
    setApiState(state: ApiState) {
        this.apiState = state;
    }

    @action
    sync() {
        this.setApiState(ApiState.SYNCING);
        return this.gitProvider
            .fetchBranchStatus(this)
            .then(
                action((res) => {
                    if (res) {
                        if (res.commits.length > 0) {
                            this.sha = res.commits[res.commits.length - 1].sha;
                        }
                        this.aheadBy = res.ahead_by;
                        this.behindBy = res.behind_by;
                        this.isSynced = true;
                    }
                })
            )
            .catch((err) => {
                console.error('error syncing branch', err);
            })
            .finally(
                action(() => {
                    this.setApiState(ApiState.IDLE);
                })
            );
    }

    @computed
    get PR() {
        return this.gitProvider.store.findPrByBranch(this.name);
    }

    @computed
    get isDefault() {
        return this.name === this.gitProvider.defaultBranchName;
    }
}

export default Branch;
