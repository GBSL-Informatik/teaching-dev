import { DocumentType, StateType, TypeDataMapping } from '@tdev-api/document';
import iSideEffect from './iSideEffect';
import _ from 'es-toolkit/compat';
import { UserStore } from '@tdev-stores/UserStore';
import { computed } from 'mobx';

const States: StateType[] = ['checked', 'question', 'unset', 'star', 'star-half', 'star-empty'] as const;

class RandomState extends iSideEffect<'task_state'> {
    readonly store: UserStore;

    constructor(userStore: UserStore) {
        super('RandomState');
        this.store = userStore;
    }

    @computed
    get transformer() {
        return (docData: TypeDataMapping['task_state']) => {
            if (!this.store.viewedUser) {
                return docData;
            }
            const idxOf = States.indexOf(docData.state);
            const totalClients = this.store.users.reduce((sum, u) => sum + u.connectedClients, 0);
            return {
                ...docData,
                state: States[(idxOf + totalClients) % States.length]
            };
        };
    }

    @computed
    get canEdit() {
        return true;
    }
}

export default RandomState;
