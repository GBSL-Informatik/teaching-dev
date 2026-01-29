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
    if (!page) {
        return null;
    }

    return (
        <div className={clsx(styles.taskableState, props.className)}>
            <Icon
                path={page.taskableDocuments?.length > 0 ? mdiCheckCircle : mdiProgressQuestion}
                size={0.8}
                color={
                    page.taskableDocuments?.length > 0
                        ? 'var(--ifm-color-success)'
                        : 'var(--ifm-color-warning)'
                }
            />
        </div>
    );
});

export default TaskableState;
