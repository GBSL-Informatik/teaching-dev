import React from 'react';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Icon from '@mdi/react';
import TaskState from '@tdev-models/documents/TaskState';
import ProgressState from '@tdev-models/documents/ProgressState';

interface Props {
    editingStatus: (TaskState | ProgressState)[];
}

const EditingStateList = observer((props: Props) => {
    const { editingStatus } = props;
    const userStore = useStore('userStore');
    return (
        <>
            {editingStatus.map((es, idx) => {
                const { path, color } = es.editingIconState;
                return (
                    <span
                        className={styles.taskState}
                        key={idx}
                        onClick={() => {
                            es.setScrollTo(true);
                            if (userStore.viewedUserId !== es.authorId) {
                                userStore.switchUser(es.authorId);
                            }
                        }}
                    >
                        <Icon path={path} color={color} size={0.8} />
                    </span>
                );
            })}
        </>
    );
});

export default EditingStateList;
