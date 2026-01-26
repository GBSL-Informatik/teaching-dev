import React from 'react';
import { observer } from 'mobx-react-lite';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import Loader from '@tdev-components/Loader';
import TaskStateComponent from '@tdev-components/documents/TaskState';
import { MetaInit, TaskMeta } from '@tdev-models/documents/TaskState';
import { ModelMeta as SolutionModelMeta } from '@tdev-models/documents/Solution';
import { useDocumentRoot } from '@tdev-hooks/useDocumentRoot';
import { NoneAccess } from '@tdev-models/helpers/accessPolicy';
import { SelfCheckStateType } from '@tdev-components/documents/SelfCheck/models';
import { SelfCheckContext, SelfCheckStateSideEffect } from '@tdev-components/documents/SelfCheck/shared';
import { DocumentModelType } from '@tdev-api/document';
import TaskState from '@tdev-models/documents/TaskState';
import { reaction } from 'mobx';

interface Props extends MetaInit {
    includeQuestion: boolean;
}

const SelfCheckTaskState = observer(({ includeQuestion = true, pagePosition }: Props) => {
    const context = React.useContext(SelfCheckContext);
    if (!context) {
        throw new Error('SelfCheckTaskState must be used within a SelfCheck');
    }

    const [taskMeta] = React.useState(new TaskMeta({ pagePosition }));
    const [solutionMeta] = React.useState(new SolutionModelMeta({}));
    const taskDoc = useFirstMainDocument(context.taskStateId, taskMeta, false);
    const taskDocRoot = useDocumentRoot(context.taskStateId, taskMeta, false);
    const solutionDoc = useFirstMainDocument(context.solutionId, solutionMeta, false);
    const solutionDocRoot = useDocumentRoot(context.solutionId, solutionMeta, false);

    React.useEffect(() => {
        taskDocRoot.allDocuments.forEach((doc: DocumentModelType) => {
            (doc as TaskState).registerSideEffect(
                new SelfCheckStateSideEffect(doc.authorId, solutionDocRoot)
            );
        });
    }, [taskDocRoot, taskDocRoot.allDocuments, solutionDocRoot]);

    if (!taskDoc) {
        return <Loader />;
    }

    const solutionAvailableForCurrentUser = !!solutionDoc && !NoneAccess.has(solutionDocRoot.permission);

    const states = [
        SelfCheckStateType.Open,
        includeQuestion ? SelfCheckStateType.Question : null,
        SelfCheckStateType.Reviewing,
        solutionAvailableForCurrentUser ? SelfCheckStateType.Done : null
    ].filter((state) => !!state);

    return <TaskStateComponent id={context.taskStateId} states={states} pagePosition={pagePosition} />;
});

export default SelfCheckTaskState;
