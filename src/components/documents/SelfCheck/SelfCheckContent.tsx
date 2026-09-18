import React from 'react';
import { observer } from 'mobx-react-lite';
import { TaskMeta } from '@tdev-models/documents/TaskState';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import { useStore } from '@tdev-hooks/useStore';
import Loader from '@tdev-components/Loader';
import { SelfCheckStateType } from '@tdev-components/documents/SelfCheck/models';
import { SelfCheckContext } from '@tdev-components/documents/SelfCheck/shared';

interface StateDependentProps {
    visibleFrom?: SelfCheckStateType;
    visibleTo?: SelfCheckStateType;
    alwaysVisibleForTeacher?: boolean;
    children?: React.ReactNode;
}

function stateIndex(state: SelfCheckStateType) {
    return Object.values(SelfCheckStateType).indexOf(state);
}

const SelfCheckContent = observer(
    ({
        visibleFrom = SelfCheckStateType.WaitingForSolution,
        visibleTo = SelfCheckStateType.Reviewing,
        alwaysVisibleForTeacher = true,
        children
    }: StateDependentProps) => {
        const context = React.useContext(SelfCheckContext);
        if (!context) {
            throw new Error('SelfCheckContent must be used within a SelfCheck');
        }

        const taskMeta = React.useMemo(() => new TaskMeta({}), []);
        const doc = useFirstMainDocument(context.taskStateId, taskMeta, false);
        const userStore = useStore('userStore');

        if (!doc) {
            return <Loader />;
        }

        const visibleFromIndex = stateIndex(visibleFrom);
        const visibleToIndex = stateIndex(visibleTo);
        const currentStateIndex = stateIndex(doc.taskState as SelfCheckStateType);

        const showElement =
            (userStore.current?.isTeacher && alwaysVisibleForTeacher) ||
            (visibleFromIndex <= currentStateIndex && currentStateIndex <= visibleToIndex);

        return <div>{showElement && children}</div>;
    }
);

export default SelfCheckContent;
