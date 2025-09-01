import styles from './styles.module.scss';
import React from 'react';
import { _AddMembersPopupPropsInternal } from './types';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import { mdiAccountArrowLeft } from '@mdi/js';
import Button from '@tdev-components/shared/Button';

const ImportGroup = observer((props: _AddMembersPopupPropsInternal) => {
    const studentGroupStore = useStore('studentGroupStore');
    const [searchFilter, setSearchFilter] = React.useState('');
    const [searchRegex, setSearchRegex] = React.useState(new RegExp(searchFilter, 'i'));

    React.useEffect(() => {
        setSearchRegex(new RegExp(searchFilter, 'i'));
    }, [searchFilter]);

    return (
        <>
            <div className={clsx('card__header', styles.header)}>
                <h3>Aus Gruppe importieren</h3>
            </div>
            <div className={clsx('card__body')}>
                <input
                    type="text"
                    placeholder="Suche..."
                    value={searchFilter}
                    className={clsx(styles.textInput)}
                    onChange={(e) => {
                        setSearchFilter(e.target.value);
                    }}
                />
                <div className={styles.listContainer}>
                    <div className={clsx(styles.list)}>
                        {studentGroupStore.managedStudentGroups
                            .filter((group) => group.id !== props.studentGroup.id)
                            .filter((user) => searchRegex.test(user.searchTerm))
                            .map((group, idx) => (
                                <div
                                    key={idx}
                                    className={clsx(
                                        styles.listItem,
                                        group.userIds.has(group.id) && styles.disabled
                                    )}
                                    title={group.name}
                                >
                                    {group.name}
                                    <div className={styles.actions}>
                                        <Button
                                            onClick={() => {
                                                const studentsToImport = group.students.filter(
                                                    (student) =>
                                                        !props.studentGroup.students.includes(student)
                                                );
                                                studentsToImport.forEach((student) =>
                                                    props.studentGroup.addStudent(student)
                                                );
                                                props.onImported(
                                                    studentsToImport.map((student) => student.id),
                                                    group
                                                );
                                            }}
                                            disabled={group.userIds.has(group.id)}
                                            icon={mdiAccountArrowLeft}
                                            color="green"
                                        />
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </>
    );
});

export default ImportGroup;
