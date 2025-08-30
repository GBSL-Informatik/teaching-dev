import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import { mdiPlusCircleOutline } from '@mdi/js';
import StudentGroup from '@tdev-components/StudentGroup';
import _ from 'es-toolkit/compat';
import scheduleMicrotask from '@tdev-components/util/scheduleMicrotask';
import { action } from 'mobx';

const StudentGroupPanel = observer(() => {
    const userStore = useStore('userStore');
    const groupStore = useStore('studentGroupStore');
    const current = userStore.current;
    if (!current?.hasElevatedAccess) {
        return null;
    }
    return (
        <div>
            <Button
                onClick={() => {
                    groupStore.create('', '').then(
                        action((group) => {
                            group?.setEditing(true);
                        })
                    );
                }}
                icon={mdiPlusCircleOutline}
                color="primary"
                text="Neue Lerngruppe erstellen"
            />
            <div className={clsx(styles.studentGroups)}>
                {_.orderBy(
                    groupStore.managedStudentGroups.filter((g) => !g.parentId),
                    ['_pristine.name', 'createdAt'],
                    ['asc', 'desc']
                ).map((group) => (
                    <StudentGroup key={group.id} studentGroup={group} className={clsx(styles.studentGroup)} />
                ))}
            </div>
        </div>
    );
});

export default StudentGroupPanel;
