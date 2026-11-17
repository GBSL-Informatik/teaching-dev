import { TypeDataMapping } from '@tdev-api/document';
import DocumentRoot from '@tdev-models/DocumentRoot';
import { NoneAccess } from '@tdev-models/helpers/accessPolicy';
import iSideEffect from '@tdev-models/SideEffects/iSideEffect';
import { computed } from 'mobx';
import { SelfCheckStateType } from './SelfCheckStateType';

class SelfCheckStateSideEffect extends iSideEffect<'task_state'> {
    private readonly authorId: string;
    private readonly solutionDocRoot: DocumentRoot<'solution'>;

    constructor(authorId: string, solutionDocRoot: DocumentRoot<'solution'>) {
        super('SelfCheckStateSideEffect');
        this.authorId = authorId;
        this.solutionDocRoot = solutionDocRoot;
    }

    @computed
    get transformer() {
        return (docData: TypeDataMapping['task_state']) => {
            const authorsPermissionOnSolution = this.solutionDocRoot.permissionForUser(this.authorId);

            if (docData.state !== SelfCheckStateType.Reviewing) {
                return docData;
            }

            const solutionAvailable = !NoneAccess.has(authorsPermissionOnSolution);
            return {
                ...docData,
                state: solutionAvailable
                    ? SelfCheckStateType.Reviewing
                    : SelfCheckStateType.WaitingForSolution
            };
        };
    }
}

export default SelfCheckStateSideEffect;
