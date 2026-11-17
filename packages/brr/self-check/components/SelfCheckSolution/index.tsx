import { Access } from '@tdev-api/document';
import Solution from '@tdev-components/documents/Solution';
import { MetaInit } from '@tdev-models/documents/TaskState';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { SelfCheckStateType } from '../../models/SelfCheckStateType';
import { SelfCheckContext } from '../SelfCheck/context';
import SelfCheckContent from '../SelfCheckContent';

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
