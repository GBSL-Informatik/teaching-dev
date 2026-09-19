import { Access } from '@tdev-api/document';
import { SelfCheckStateType } from '@tdev-components/documents/SelfCheck/models';
import SelfCheckContent from '@tdev-components/documents/SelfCheck/SelfCheckContent';
import { SelfCheckContext } from '@tdev-components/documents/SelfCheck/shared';
import Solution from '@tdev-components/documents/Solution';
import { MetaInit } from '@tdev-models/documents/TaskState';
import { observer } from 'mobx-react-lite';
import React from 'react';

interface Props extends MetaInit {
    visibleFrom?: SelfCheckStateType;
    visibleTo?: SelfCheckStateType;
    alwaysVisibleForTeacher?: boolean;
    standalone?: boolean;
    title?: string;
    open?: boolean;
    className?: string;
    access?: Access;
    children: React.ReactNode;
}

const SelfCheckSolution = observer((props: Props) => {
    const context = React.useContext(SelfCheckContext);
    if (!context) {
        throw new Error('SelfCheckSolution must be used within a SelfCheck');
    }

    return (
        <SelfCheckContent {...props}>
            <Solution {...props} id={context.solutionId}>
                {props.children}
            </Solution>
        </SelfCheckContent>
    );
});

export default SelfCheckSolution;
