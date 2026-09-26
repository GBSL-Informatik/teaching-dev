import { TypeDataMapping } from '@tdev-api/document';
import { SelfCheckStateType } from '@tdev-components/documents/SelfCheck/models';
import DocumentRoot from '@tdev-models/DocumentRoot';
import { NoneAccess } from '@tdev-models/helpers/accessPolicy';
import iSideEffect from '@tdev-models/SideEffects/iSideEffect';
import { computed } from 'mobx';
import React from 'react';

interface SelfCheckContextType {
    solutionId: string;
    taskStateId: string;
}

export const SelfCheckContext = React.createContext<SelfCheckContextType | undefined>(undefined);

export class SelfCheckStateSideEffect extends iSideEffect<'task_state'> {
    constructor(
        private readonly authorId: string,
        private readonly solutionDocRoot: DocumentRoot<'solution'>
    ) {
        super('SelfCheckStateSideEffect');
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
