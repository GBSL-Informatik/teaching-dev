import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Page from '@tdev-models/Page';
import Icon from '@mdi/react';
import { mdiCheckCircle, mdiProgressQuestion } from '@mdi/js';

interface Props {
    page?: Page;
    className?: string;
}

const TaskableState = observer((props: Props) => {
    const { page } = props;
    if (!page || page.totalSteps === 0) {
        return null;
    }

    return (
        <div
            className={clsx(styles.taskableState, props.className)}
            title={`Progress: ${page.progress} / ${page.totalSteps}`}
        >
            <Icon path={page.editingIconState.path} size={0.8} color={page.editingIconState.color} />
        </div>
    );
});

export default TaskableState;
