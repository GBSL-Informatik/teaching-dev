import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Page from '@tdev-models/Page';
import Icon from '@mdi/react';
import useIsBrowser from '@docusaurus/useIsBrowser';

interface Props {
    page?: Page;
    className?: string;
    forcedAction?: 'show' | 'hide';
}

const TaskableState = observer((props: Props) => {
    const { page } = props;
    const isBrowser = useIsBrowser();
    const forceHide = props.forcedAction === 'hide';
    if (forceHide) {
        return null;
    }

    if (!isBrowser || !page) {
        return null;
    }
    const forceShow = props.forcedAction === 'show';

    if (!forceShow && page.stepsOnPage === 0 && page.stepsOnDirectSubPages === 0) {
        return null;
    }

    return (
        <div
            className={clsx(styles.taskableState, props.className)}
            title={`Progress: ${page.progress} / ${page.totalSteps}`}
            onClick={(e) => {
                const thisElement = e.currentTarget;
                thisElement.parentElement?.querySelector('a')?.click();
            }}
        >
            <Icon
                path={page.editingIconState.path}
                size={0.8}
                color={page.editingIconState.color}
                className={clsx(styles.icon)}
            />
        </div>
    );
});

export default TaskableState;
